// Cloudflare Worker fronting the static assets (wrangler.jsonc `main`).
//
// Why a Worker instead of assets-only with `not_found_handling:
// "single-page-application"`: SPA mode answers EVERY unknown path with the
// index shell and HTTP 200, which turns the whole site into soft 404s (bad
// for crawlers and AI-agent discovery clients — /llms.txt and
// /.well-known/*.json all returned HTML 200). Instead, the Worker serves the
// SPA shell only for real application routes and lets the assets binding
// return genuine 404s for everything else.

interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> }
}

// Application routes handled by React Router (src/App.tsx).
const SPA_ROUTE = /^\/(?:agents\/[^/]+\/[^/]+)?\/?$/

const NOT_FOUND_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, follow">
<title>Page not found | FreeLLMAgents</title>
</head>
<body>
<h1>Page not found</h1>
<p>The page you're looking for doesn't exist. <a href="/">Browse all repositories</a>.</p>
</body>
</html>`

function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers)
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains',
  )
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url)

    // SPA routes (home + repository detail pages): serve the app shell. The
    // router then renders the real page, including its noindex 404 state for
    // repositories that are not in the database.
    if (SPA_ROUTE.test(pathname)) {
      const url = new URL(request.url)
      const asset = await env.ASSETS.fetch(new URL('/index.html', url))
      return withSecurityHeaders(asset)
    }

    // Everything else must be a real static file (robots.txt, sitemap.xml,
    // llms.txt, og-image.png, hashed assets, ...). Missing files get a real
    // 404 instead of the SPA shell.
    const response = await env.ASSETS.fetch(request)
    if (response.status === 404) {
      return withSecurityHeaders(
        new Response(NOT_FOUND_HTML, {
          status: 404,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        }),
      )
    }
    return withSecurityHeaders(response)
  },
}
