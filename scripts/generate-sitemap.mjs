// Generates dist/sitemap.xml from the Convex repository data at build time
// (AGENTS.md section 37). Requires VITE_CONVEX_URL to be set (written by
// `npx convex dev`); best-effort — a build must not fail if the deployment
// is unreachable.
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const convexUrl = process.env.VITE_CONVEX_URL

const SITE = 'https://freellmagents.com'
const MAX_PATHS = 50_000 // one sitemap limit per search engines

try {
  await main()
} catch (error) {
  console.warn(`generate-sitemap: skipped (${error.message})`)
}

async function main() {
  if (!convexUrl) {
    console.warn('generate-sitemap: VITE_CONVEX_URL not set, skipping.')
    return
  }

  const paths = []
  let cursor
  let isDone = false
  while (!isDone && paths.length < MAX_PATHS) {
    // Omit the cursor key entirely — Convex validators reject explicit nulls
    // over the HTTP API.
    const page = await queryPage(
      'repos:sitemapRepos',
      cursor === undefined ? {} : { cursor },
    )
    paths.push(...page.paths)
    cursor = page.cursor
    isDone = page.isDone
  }

  // One canonical URL per repository, no query parameters, XML-escaped.
  const uniquePaths = [...new Set(paths.filter((p) => typeof p === 'string'))]
  const today = new Date().toISOString().slice(0, 10)
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE}/</loc>
    <lastmod>${today}</lastmod>
  </url>
${uniquePaths
  .map(
    (path) => `  <url>
    <loc>${SITE}/${escapeXml(path)}</loc>
    <lastmod>${today}</lastmod>
  </url>`,
  )
  .join('\n')}
</urlset>
`

  await mkdir(resolve(root, 'dist'), { recursive: true })
  await writeFile(resolve(root, 'dist', 'sitemap.xml'), xml)
  console.log(`generate-sitemap: wrote ${uniquePaths.length} repository URLs.`)
}

function escapeXml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

async function queryPage(functionPath, args) {
  const response = await fetch(`${convexUrl}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: functionPath, args, format: 'json' }),
  })
  if (!response.ok) {
    throw new Error(`Convex query failed: ${response.status}`)
  }
  const { status, value } = await response.json()
  if (status !== 'success') {
    throw new Error(`Convex query error: ${status}`)
  }
  return value
}
