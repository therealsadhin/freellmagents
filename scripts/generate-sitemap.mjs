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

  const entries = []
  let cursor
  let isDone = false
  while (!isDone && entries.length < MAX_PATHS) {
    // Omit the cursor key entirely — Convex validators reject explicit nulls
    // over the HTTP API.
    const page = await queryPage(
      'repos:sitemapRepos',
      cursor === undefined ? {} : { cursor },
    )
    entries.push(...(page.entries ?? page.paths.map((p) => ({ path: p, description: '' }))))
    cursor = page.cursor
    isDone = page.isDone
  }

  // One canonical URL per repository, no query parameters, XML-escaped.
  const uniquePaths = [
    ...new Set(entries.map((e) => e.path).filter((p) => typeof p === 'string')),
  ]
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

  // llms.txt (llmstxt.org convention): grounded in the same Convex repository
  // data — name, owner and stored description only, nothing invented. Lets
  // AI crawlers discover the directory without executing JavaScript and gives
  // /llms.txt a real 200 answer (SEO-AUDIT.md issue 6).
  // Legacy Convex deployments (pre-llms.txt) return bare path strings; llms.txt
  // needs the repository fields, so it is skipped until Convex is redeployed.
  const llmsEntries = entries.filter((e) => e.name && e.owner)
  if (llmsEntries.length === 0) {
    console.warn('generate-sitemap: no repository fields returned, skipping llms.txt.')
  }
  const sorted = [...llmsEntries].sort((a, b) => b.stars - a.stars)
  const llmsLines = [
    '# FreeLLMAgents',
    '',
    'A public directory of free and open-source AI, LLM and agent-related GitHub',
    'repositories, discovered and normalised from the GitHub API. Each repository',
    'page lists what the project does, its features, topics, license and GitHub',
    'metadata, with a link to the original repository.',
    '',
    '## Repositories',
    '',
    ...sorted.map((entry) => {
      const desc = entry.description
        ? `: ${entry.description.slice(0, 160).replace(/\s+/g, ' ').trim()}`
        : ''
      return `- [${entry.owner}/${entry.name}](${SITE}/${entry.path})${desc}`
    }),
    '',
  ]
  const llmsTxt = llmsLines.join('\n')

  await mkdir(resolve(root, 'dist'), { recursive: true })
  await writeFile(resolve(root, 'dist', 'sitemap.xml'), xml)
  if (llmsEntries.length > 0) {
    await writeFile(resolve(root, 'dist', 'llms.txt'), llmsTxt)
  }
  console.log(
    `generate-sitemap: wrote ${uniquePaths.length} repository URLs${
      llmsEntries.length > 0 ? ' and llms.txt' : ''
    }.`,
  )
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
