# SEO Audit — freellmagents.com

Audited 2026-09-27 against the live production site (`https://freellmagents.com/`) and the
source in this repository. Tooling: Claude SEO skill (`claude-seo` v2.4.0 runtime —
`fetch_page`, `render_page`, `agentic_check`) plus direct inspection of robots.txt,
sitemap.xml, HTTP headers, redirect behaviour, and the rendered DOM of a representative
repository detail page (`/agents/browser-use/browser-use`).

## 1. Current SEO state

The site's fundamentals are strong for a client-rendered SPA:

- Per-page `<title>`, meta description, canonical, Open Graph, Twitter card and JSON-LD
  (`WebSite` + `SearchAction` on the homepage; `SoftwareSourceCode` + `BreadcrumbList` on
  repository pages) are all set dynamically via `src/hooks/useSeo.ts` and verified present
  in the rendered DOM.
- `robots.txt` allows all crawlers and references the sitemap.
- `sitemap.xml` is generated at build time from the live Convex database (273 repository
  URLs at audit time), one canonical URL per repository, XML-escaped, deduplicated.
- Repository pages carry real, grounded content: description, README-derived overview,
  features, topics, license, language, stars/forks, dates.
- Sitemap URLs return 200 and render full content in a headless browser (Googlebot-class
  rendering works).

## 2. Critical issues

1. **Soft 404s sitewide (SPA catch-all).** Every unknown path — `/llms.txt`,
   `/.well-known/ai-catalog.json`, random garbage URLs — returns HTTP 200 with the SPA
   shell. Confirmed by the skill's `agentic_check`:
   - P0: no primary content without JavaScript on the SPA shell served for unknown paths.
   - P1 fail: `/llms.txt` answered with HTML 200 (Lighthouse `llms-txt` audit fails).
   - P1 fail: `/.well-known/ai-catalog.json` answered with HTML 200 (`ard-schema` fails).
   - P1 warn: unknown URLs return 200 → crawlers see soft 404s; crawl budget is wasted and
     garbage URLs can be indexed.
   Root cause: Cloudflare Workers assets is configured with
   `not_found_handling: "single-page-application"` and there is no Worker to distinguish
   SPA routes from genuinely missing files.

## 3. High-priority issues

2. **`www.freellmagents.com` returns HTTP 520.** The `www` subdomain is not correctly
   configured at the Cloudflare zone level (no working origin/redirect). Users and crawlers
   hitting `www` get an error instead of a redirect to the canonical host. *(External
   Cloudflare setting — see Remaining Work in the implementation report.)*
3. **Plain HTTP serves 200 without redirecting to HTTPS** (`http://freellmagents.com/` →
   200). Duplicate-protocol crawling risk. Canonical tags mitigate, but "Always Use HTTPS"
   should be enabled at the zone level. *(External Cloudflare setting.)*
4. **README overview text is mojibake-corrupted.** `convex/github.ts` decodes base64 README
   content with `atob()` alone, which yields Latin-1 — multi-byte UTF-8 (curly quotes, em
   dashes, non-Latin text) is stored corrupted (visible on `/agents/browser-use/browser-use`:
   "…prompts â"). Corrupted text harms content quality and AI-citability.
5. **Repository pages have no outbound internal links.** Detail pages link only back to the
   homepage. No related-repository links, no category links → most of the 273 repository
   pages are reachable only via the paginated homepage (first 24 repos) and the sitemap.
   Orphan risk for every repository not on page 1.

## 4. Medium-priority issues

6. **No `llms.txt`** (real file). The path currently returns the SPA shell. A grounded
   llms.txt (site purpose + top repositories with descriptions from the database) is
   defensible for a directory site and fixes the Lighthouse `llms-txt` failure.
7. **Trailing-slash variants return 200** (e.g. `/agents/browser-use/browser-use/`).
   Each variant declares its own canonical, which prevents consolidation problems, but the
   duplicates are still crawlable. Best handled by Cloudflare redirects/normalisation at
   the edge. *(External, or handled by the new Worker.)*
8. **`og:image:width`/`og:image:height` missing on repository pages** (present only in the
   static `index.html`). Minor social-crawl robustness issue.
9. **`SoftwareSourceCode.author` is always `Person`**, even for organisation-owned repos
   (e.g. `browser-use` org). Minor schema accuracy issue; the owner type is not stored in
   Convex.

## 5. Low-priority issues

10. Category names in the metadata sidebar of detail pages are plain text, not links (same
    root cause as issue 5 — no category routes exist; categories are client-side filters).
11. The homepage `SearchAction` target uses `?q=` which the homepage honours — good — but
    `?q=` URLs themselves return 200 and are indexable-looking; canonical tags on the SPA
    always point to the clean path, so consolidation is correct. No action needed beyond
    monitoring.
12. No `Content-Signal` / AI-crawler-specific robots groups. Optional, not defensible as a
    requirement today.

## 6. Pages currently indexable

- `/` (homepage) — indexable, canonical to itself.
- 273 `/agents/:owner/:repo` URLs in the sitemap — all return 200, render content, and
  declare self-canonicals.

## 7. Pages that should be indexable

- Homepage and all genuine repository pages (already are).
- No other page types exist; category/search/filter views are client-side state with no
  separate URLs (correct — no duplicate-URL risk).

## 8. Pages that should NOT be indexed

- Unknown/invalid paths (currently soft-200 — must become real 404s).
- Repository not-found pages — already `noindex, follow` via `useSeo`.
- Search/filter URL variants — none exist as URLs.

## 9. Canonical URL problems

- No same-host duplicates (single host, clean paths, no URL params for filters).
- Protocol (`http`) and trailing-slash variants are crawlable duplicates — mitigated by
  self-canonicals; edge-level normalisation recommended.
- `www` host is broken (520) rather than duplicating — worse for users, not for
  canonicalisation.

## 10. Metadata problems

- `og:image:width`/`height` missing on dynamic pages (minor).
- Titles/descriptions are unique and grounded per repository; no template duplication found
  in sampled pages.

## 11. Structured-data problems

- JSON-LD is valid, minimal, and matches visible content. No fabricated ratings/authors.
- `author` typed as `Person` for orgs (minor).
- No `Organization` schema for the site itself on the homepage (optional).

## 12. Internal-linking problems

- Repository pages are near-orphans: single inbound internal link (homepage card grid,
  paginated 24 at a time). Needs related-repository links and sitemap-only discovery is not
  a substitute for internal linking.

## 13. Sitemap problems

- None structural. Generated from live Convex data, canonical paths only, no
  search/filter/noindex URLs. `lastmod` is build-date rather than per-repo push date
  (acceptable; not per-URL accurate).

## 14. robots.txt problems

- None. Allows all, references sitemap.

## 15. JavaScript rendering/indexing risks

- Headless rendering works and produces full content + metadata (verified).
- Non-JS crawlers see the static shell — the documented known limitation. Fixing it means
  prerendering (candidate future work); not required for Google.
- Unknown paths returning the shell (soft 404) is the actual indexing risk — see Critical
  issue 1.

## 16. Core Web Vitals / performance issues

- Fonts load non-render-blocking with `preconnect`; good.
- Single JS/CSS bundle; reasonable for a directory SPA. No obvious render-blocking
  resources. Field data (CrUX) unavailable for this domain — no lab measurements were
  fabricated.

## 17. AI-search / GEO issues

- `llms.txt` broken (P1) — see issue 6.
- No markdown version of pages (optional).
- Repository pages already contain concise factual overviews + structured data, which is
  the core GEO asset. Mojibake (issue 4) directly harms citability.

## 18. Programmatic SEO risks

- 273 pages, each grounded in real GitHub data with unique titles/descriptions — low thin-
  content risk. Repositories with no description AND no README summary fall back to a
  generic one-liner (`"X by Y — open-source GitHub repository."`) — monitor the share of
  these; they are the thin-content tail.

## 19. Duplicate / thin-content risks

- Trailing-slash and protocol variants (crawachable, canonical-consolidated).
- Generic-fallback description pages (see 18). No action beyond monitoring; never fabricate
  content to bulk them up (AGENTS.md §14).

## Priority action plan

| # | Fix | Priority |
|---|-----|----------|
| 1 | Real 404s for unknown paths via Worker + assets config; keep SPA routes working | Critical |
| 2 | Fix UTF-8 README decoding (mojibake) | High |
| 3 | Related-repositories internal links on detail pages + Convex query | High |
| 4 | Generate grounded `llms.txt` at build time | Medium |
| 5 | `og:image` width/height on dynamic pages | Medium |
| 6 | Cloudflare zone: enable Always Use HTTPS; fix `www` → 301 to apex | External |
