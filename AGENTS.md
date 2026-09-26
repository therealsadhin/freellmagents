# AGENTS.md

## 1. AI Role

You are the principal implementation engineer for this project.

Your job is to:
1. Understand the existing product and codebase before changing anything.
2. Follow this `AGENTS.md` as the source of truth for product and implementation decisions.
3. Inspect existing code, configuration, and installed packages before introducing new patterns.
4. Create a concise implementation plan/prompt for non-trivial features before coding.
5. Implement only the requested scope.
6. Run the relevant checks after implementation.
7. Report what changed and what was actually tested.

Do not redesign the product, change the stack, or add unrelated features unless explicitly requested.

---

## 2. Product

**freellmagents.com** is a public directory/discovery website for open-source and free AI/LLM agents and agent-related GitHub repositories.

The site collects relevant public GitHub repositories and presents them in one searchable, categorised interface.

Examples of the type of repositories this product may surface include:
- Crawl4AI
- Browser-use / browser agents
- LLM agents
- coding agents
- research agents
- automation agents
- AI browser agents
- multi-agent frameworks
- agent tooling and infrastructure

The goal is discovery, not hosting or executing the repositories.

Users can:
- browse repositories
- search repositories
- filter by category, language, and other available metadata
- sort by popularity, recent updates, forks, or trending signals
- open a repository detail page
- read a concise explanation of what the project does
- see features and relevant repository metadata
- visit the original GitHub repository

There is **no user authentication** and no user account system in the initial version.

---

## 3. Product Scope

### In scope

- Public repository directory
- GitHub repository discovery
- Repository synchronisation
- Categories
- Search
- Sorting
- Filtering
- Trending repositories
- New repositories
- Repository detail pages
- Repository descriptions
- Feature summaries
- GitHub metadata
- External links to GitHub
- Responsive UI
- Convex database
- Scheduled/background repository updates where supported by the chosen deployment setup

### Explicitly out of scope

Do not build these unless explicitly requested:

- User authentication
- User profiles
- Favourites/bookmarks
- User submissions
- Comments
- Ratings or reviews
- Social features
- Payments
- AI chat
- Running agents inside the website
- Repository hosting
- Code execution/sandboxing
- GitHub OAuth for visitors
- Admin dashboard unless explicitly requested
- Complex recommendation systems
- Vector/embedding search unless explicitly requested

Keep the first version focused on discovery.

---

## 4. Technology Stack

Use this stack unless the user explicitly changes it:

- **Frontend:** Vite + React + TypeScript
- **Backend/database:** Convex
- **Styling:** Tailwind CSS if already installed/configured; otherwise follow the existing project styling system
- **Data source:** GitHub public repository/API data
- **Authentication:** None for website users
- **Deployment:** compatible with the chosen frontend/backend deployment
- **Icons:** use the project's existing icon library if one exists

Do not introduce another backend framework.

Do not introduce Supabase, Firebase, PostgreSQL, Prisma, Express, Next.js, Clerk, or another authentication system unless explicitly requested.

Convex is responsible for persisted repository data and backend functions. Convex's React integration supports Vite/React applications and exposes typed queries/mutations through the generated API. 

---

## 5. Core Architecture

The architecture should be:

```text
GitHub API
    |
    | scheduled/background sync
    v
Convex backend functions
    |
    v
Convex database
    |
    v
React + Vite frontend
    |
    +--> Repository directory
    +--> Search/filter/sort
    +--> Repository detail page
    |
    +--> External link to GitHub
```

### Important rule

Do **not** make every visitor directly query GitHub's API.

GitHub data should be fetched by the backend synchronisation process and stored in Convex.

Visitors read repository data from Convex.

This prevents the public website from consuming GitHub API quota for every page view and makes the directory much faster and more stable.

GitHub currently documents a 60-request/hour primary limit for unauthenticated REST API requests and 5,000 requests/hour for authenticated requests; GitHub search endpoints have their own tighter limits, including 10 unauthenticated search requests/minute and 30 authenticated search requests/minute. Treat these limits as implementation constraints. 

---

## 6. GitHub Data Synchronisation

Repository discovery is a backend responsibility.

The synchronisation system should:

1. Search GitHub for relevant repositories.
2. Retrieve repository metadata.
3. Determine whether a repository is relevant to the product.
4. Normalise the data.
5. Upsert it into Convex.
6. Record the last synchronisation time.
7. Avoid unnecessary repeated API requests.
8. Handle GitHub rate limits and API errors gracefully.

### Never

- Fetch GitHub data separately for every visitor.
- Store GitHub tokens in client-side code.
- Put GitHub credentials in Vite client environment variables.
- Assume every repository returned by GitHub is an AI agent.
- Claim a repository is "free" without evidence.

### GitHub credentials

If an authenticated GitHub API credential is used, it must exist only in the backend/server environment.

Never expose:
- GitHub personal access tokens
- GitHub App private keys
- GitHub client secrets
- other private API credentials

to browser code.

---

## 7. Repository Discovery

The system should use several discovery concepts rather than one hard-coded GitHub query.

Potential discovery groups:

### AI / LLM Agents
- `llm agent`
- `ai agent`
- `autonomous agent`
- `agent framework`

### Coding Agents
- `coding agent`
- `code agent`
- `software engineering agent`

### Browser Agents
- `browser agent`
- `web agent`
- `browser automation ai`

### Research Agents
- `research agent`
- `deep research`
- `web research agent`

### Automation Agents
- `automation agent`
- `workflow agent`
- `task agent`

### Multi-Agent
- `multi-agent`
- `multi agent framework`
- `agent orchestration`

### Agent Infrastructure
- agent framework
- agent memory
- agent tools
- MCP
- tool calling
- agent evaluation

These are discovery seeds, not guaranteed classifications.

---

## 8. Relevance Classification

A GitHub repository should only appear in the directory when it is reasonably relevant to the product.

Use repository evidence such as:

- repository name
- description
- README
- topics
- primary language
- repository metadata

Do not classify a repository solely because the word `AI` appears in its README.

### Relevance categories

Use a controlled category list:

- AI / LLM Agents
- Coding Agents
- Browser Agents
- Research Agents
- Automation Agents
- Multi-Agent Systems
- Agent Frameworks
- Agent Tools
- MCP / Tooling
- Other

A repository may have more than one category if the data model supports it.

---

## 9. "Free" Classification

The website is focused on free/open-source agents.

Do not automatically equate:

- GitHub repository = free software
- open source = completely free to operate
- API access = free
- model usage = free

A repository can be open source while requiring paid APIs, hosted services, or paid model providers.

When displaying a "Free" or "Open Source" label, base it on repository/licensing evidence.

Prefer explicit fields such as:
- open-source license
- repository license
- self-hostable
- free to use according to documented project information

If the available data does not support a strong claim, use neutral wording rather than inventing one.

---

## 10. Trending

"Trending" is a product concept and must be based on a documented, reproducible signal.

Do not invent a trending score.

Possible signals include:
- recent star growth
- recent fork growth
- repository activity
- recent commits
- GitHub search/trending data when legally and technically appropriate
- a calculated internal trend score based on stored historical snapshots

If historical data is unavailable, do not pretend that a repository's current star count alone represents "trending".

The implementation should make the trending calculation explicit and deterministic.

---

## 11. New Repositories

"New" should refer to repositories recently created or recently discovered by the synchronisation system.

Store:
- GitHub `created_at`
- GitHub `updated_at`
- firstSeenAt
- lastSyncedAt

Use `created_at` when the UI specifically means "new repository".

Use `updated_at` when the UI means "recently updated".

Do not mix these meanings.

---

## 12. Repository Data Model

The Convex schema should be designed around the directory's actual needs.

A repository record should be capable of storing at least:

```text
githubId
owner
name
fullName
htmlUrl
description
readmeSummary
license
primaryLanguage
languages
topics
stars
forks
openIssues
watchers
createdAt
updatedAt
pushedAt
firstSeenAt
lastSyncedAt
categories
features
isRelevant
isOpenSource
isFree
trendScore
```

Use appropriate Convex value types.

Do not store unnecessary raw GitHub API responses if normalised fields are sufficient.

If raw API data is needed for debugging, keep it separate and minimise what is stored.

---

## 13. Repository Detail Page

Each repository should have a dedicated detail view.

The page should communicate:

### Identity
- repository name
- owner
- avatar/icon where available
- short description
- GitHub link

### Overview
- what the project does
- who it is for
- primary use case

### Features
Show a concise list of meaningful features derived from repository evidence.

Do not fabricate features.

### Metadata
- stars
- forks
- primary language
- license
- categories
- last updated
- created date

### External action

The primary external action should take the user to the original GitHub repository.

The website should not pretend to replace GitHub.

---

## 14. Generated Repository Summaries

Repository summaries and feature lists must be grounded in GitHub data.

Preferred sources:

1. Repository description
2. README
3. GitHub topics
4. Repository metadata

Do not invent:
- features
- integrations
- supported models
- pricing
- compatibility
- benchmarks
- performance claims

If an AI summarisation step is introduced later, the AI output must be treated as derived content and should remain grounded in the repository source.

The original GitHub URL must always remain available.

---

## 15. Search

Search is a core feature.

Search should operate over the repository data stored in Convex rather than calling GitHub directly for every keystroke.

Search should be able to match relevant fields such as:

- repository name
- owner
- description
- topics
- categories
- language
- feature text
- summary

### Search behaviour

- Search should feel immediate.
- Debounce user input where appropriate.
- Show a useful empty state.
- Do not return unrelated repositories merely because they contain a generic keyword.
- Preserve filters while searching.
- Allow clearing search easily.

Do not build a chatbot search interface.

The product is a repository discovery directory.

---

## 16. Filters

Initial filters may include:

- Category
- Language
- License
- Open Source
- Free
- Repository age
- Recently updated

Only expose filters that have reliable underlying data.

Do not create a filter whose values are manually guessed.

---

## 17. Sorting

Initial sorting options:

- Most Stars
- Recently Updated
- Most Forks
- Newest
- Trending

Sorting must use real stored fields or a documented calculation.

Do not use randomisation.

---

## 18. UI / Design Rules

The provided desktop design reference is the source of truth for the visual direction.

The UI should preserve the reference's:
- dark visual language
- editorial/modern typography
- restrained use of bold text
- spacious layout
- left category navigation
- prominent search
- repository cards
- subtle borders
- subdued metadata
- clear hierarchy
- rounded controls
- understated visual effects

Do not replace the visual style with a generic SaaS dashboard.

The repository cards should remain information-dense but readable.

### Desktop

The provided desktop reference should be reproduced closely.

Do not arbitrarily change:
- layout
- spacing
- typography hierarchy
- card structure
- navigation structure
- overall colour treatment

### Responsive behaviour

No separate mobile reference is currently defined.

On smaller screens:
- collapse or transform the sidebar sensibly
- keep search accessible
- reduce card columns
- preserve hierarchy
- prevent horizontal overflow
- keep repository actions usable

Do not redesign the desktop version merely to accommodate mobile.

---

## 19. UI Components

Prefer reusable components such as:

```text
AppShell
Sidebar
TopBar
SearchBar
CategoryList
SortControls
FilterButton
RepositoryGrid
RepositoryCard
RepositoryMeta
RepositoryTags
RepositoryDetail
FeatureList
EmptyState
LoadingState
ErrorState
Pagination / LoadMore
```

Do not duplicate nearly identical card markup across pages.

---

## 20. Navigation

The initial application should have simple public navigation.

Suggested routes:

```text
/
 /repositories/:owner/:repo
 /category/:category
 /search
```

Do not add routes that are not required by the product.

If the existing project already has a routing convention, follow it rather than replacing it unnecessarily.

---

## 21. No Authentication

There is intentionally no user authentication.

Do not add:
- Clerk
- Auth0
- Firebase Auth
- custom login
- signup
- user sessions

unless explicitly requested later.

All repository browsing functionality should work for an anonymous visitor.

---

## 22. Convex Responsibilities

Convex should handle:

- repository storage
- repository queries
- repository mutations
- synchronisation actions where appropriate
- filtering/query logic
- trend calculations where appropriate
- synchronisation metadata

The React frontend should consume Convex data through the Convex React client.

Do not put sensitive GitHub API operations directly in browser components.

---

## 23. Sync Strategy

The first implementation should support a controlled synchronisation process.

A sync should be able to:

1. Search selected GitHub queries.
2. Collect repository IDs.
3. Deduplicate repositories.
4. Fetch required repository metadata.
5. Determine categories/relevance.
6. Generate/update structured fields.
7. Upsert records into Convex.
8. Record sync status.

Use batching and rate-limit-aware behaviour.

If GitHub returns rate-limit information, respect it.

Do not create an aggressive infinite retry loop.

---

## 24. Failure Handling

The application should gracefully handle:

### GitHub API failure
- Keep existing Convex data available.
- Record sync failure.
- Do not delete existing repositories merely because one sync failed.

### Missing README
Use available repository metadata.

### Missing description
Use a neutral fallback based only on verified data.

### Missing license
Display "License not specified" rather than guessing.

### Missing language
Display "Not specified" rather than guessing.

### Empty search
Show a useful empty state.

### Repository deleted or unavailable
Do not immediately delete it from the database. Prefer a controlled stale/archived state if needed.

---

## 25. Data Freshness

Every repository should have synchronisation metadata.

At minimum:

```text
firstSeenAt
lastSyncedAt
githubUpdatedAt
githubPushedAt
```

The UI should not claim data is live unless it actually is.

If a value was last synchronised hours/days ago, represent that honestly.

---

## 26. Security

Never expose backend secrets.

Client-safe:
- public Convex deployment URL
- public GitHub repository URLs
- public application configuration

Not client-safe:
- GitHub personal access tokens
- GitHub App private keys
- API secrets
- server-only credentials

Never commit secrets to Git.

Use environment variables for credentials.

---

## 27. Performance

The directory should feel fast even when the database contains thousands of repositories.

Prefer:
- paginated queries
- indexed Convex fields
- server-side filtering where appropriate
- cached/stored GitHub data
- debounced search
- lazy loading where useful
- optimised images
- minimal client-side computation

Do not load every repository into the browser just to filter it locally.

---

## 28. SEO

Repository detail pages should be discoverable by search engines.

Use meaningful:
- page titles
- descriptions
- canonical URLs where appropriate
- repository names
- category information

Avoid generating thousands of thin or duplicate pages.

SEO content must remain grounded in the stored repository data.

---

## 29. Accessibility

The application should:
- use semantic HTML
- provide keyboard navigation
- maintain visible focus states
- provide accessible labels for icon-only buttons
- maintain sufficient contrast
- avoid relying on colour alone
- make search and filtering keyboard accessible

Do not sacrifice accessibility merely to reproduce decorative effects.

---

## 30. Scope Discipline

Before adding a feature, ask:

1. Is it required for repository discovery?
2. Is it explicitly part of the current scope?
3. Does it improve browsing, searching, filtering, or understanding repositories?
4. Can it be implemented without introducing unnecessary infrastructure?

If not, do not add it.

---

## 31. Implementation Workflow

For non-trivial tasks:

```text
READ AGENTS.md
    ↓
INSPECT EXISTING CODE
    ↓
READ RELEVANT DOCUMENTATION
    ↓
CREATE IMPLEMENTATION PLAN
    ↓
REVIEW / APPROVE
    ↓
IMPLEMENT
    ↓
TEST
    ↓
FIX
    ↓
REPORT
```

Do not immediately start changing files after receiving a vague feature request.

Ask one focused clarification only when the request genuinely cannot be implemented safely from the existing product rules.

---

## 32. Before Coding

Inspect:

- `package.json`
- Vite configuration
- TypeScript configuration
- existing React components
- routing
- Tailwind/styling configuration
- Convex configuration
- Convex schema
- environment configuration
- existing API/sync functions

Do not recreate infrastructure that already exists.

---

## 33. Testing

After implementation, run the relevant checks.

At minimum, where available:

```bash
npm run lint
npm run build
```

Also run:

```bash
npx tsc --noEmit
```

when TypeScript configuration supports it.

For Convex changes, verify that Convex functions deploy/type-check correctly.

For UI changes, manually test:

- homepage
- search
- filters
- sorting
- category navigation
- repository detail page
- GitHub external link
- loading state
- empty state
- error state
- responsive layout

Never claim a check passed unless it was actually run.

---

## 34. Common Traps

Avoid these mistakes:

### Trap 1: Calling GitHub from the browser

Do not.

Use backend synchronisation and Convex.

### Trap 2: Treating every AI repository as an agent

Relevance must be based on evidence.

### Trap 3: Calling something "free" without evidence

Check licensing and documented usage requirements.

### Trap 4: Fake trending data

Trending must have a reproducible calculation.

### Trap 5: Invented repository features

All feature descriptions must be grounded in repository information.

### Trap 6: Overbuilding

Do not add authentication, accounts, social features, AI chat, payments, or agent execution.

### Trap 7: Generic dashboard UI

The supplied design is intentional. Follow it.

### Trap 8: Loading the entire database client-side

Use Convex queries, indexes, filtering, and pagination appropriately.

### Trap 9: Exposing GitHub credentials

GitHub credentials must remain server-side.

### Trap 10: Deleting data after a temporary API failure

A failed sync should not destroy previously valid repository records.

---

## 35. Product Truth

The following decisions are already made:

- Product name/domain: `freellmagents.com`
- Product type: public GitHub repository discovery directory
- Primary subject: free/open-source AI/LLM agents and related tooling
- Frontend: Vite + React + TypeScript
- Backend/database: Convex
- User authentication: none
- Repository execution: none
- GitHub is the source of repository information
- Convex stores the application's normalised repository data
- Users are redirected to the original GitHub repository
- Search, categories, filters, sorting, trending, and new repositories are core discovery features
- Desktop UI follows the supplied reference design

Do not repeatedly reconsider these decisions during implementation.

---

## 36. When in Doubt

When uncertain:

- Keep the implementation small.
- Preserve the existing architecture.
- Use the existing component patterns.
- Check the official documentation.
- Keep GitHub credentials private.
- Keep repository information grounded in GitHub data.
- Do not invent metadata.
- Do not call a repository free without evidence.
- Do not call a repository trending without a defined signal.
- Do not add authentication.
- Do not add unrelated features.
- Match the provided UI reference.
- Run the checks.
- Report the actual result.

The objective is a fast, reliable, visually polished repository discovery product — not a large social platform.

---

## 37. SEO and Indexable Repository Pages

freellmagents.com is intended to receive organic search traffic through useful, individual repository pages.

Every real repository in the directory should have its own unique, indexable page.

The repository detail page must NOT be implemented merely as a modal, client-side overlay, or JavaScript-only state.

Each repository should have a permanent URL.

Preferred URL structure:

```text
/agents/:owner/:repo
```

Examples:

- `/agents/crawl4ai/crawl4ai`
- `/agents/browser-use/browser-use`
- `/agents/openhands/openhands`

This supersedes the earlier suggested `/repositories/:owner/:repo` route in section 20.

If the repository URL structure is changed later, preserve the same principle: every repository must have a stable, unique URL.

### SEO principles

The goal is not to generate pages merely to increase the number of indexed URLs.

Every repository page must contain genuinely useful repository-specific information derived from the underlying GitHub data.

Do not create thin pages with only:

- repository name
- star count
- GitHub link

A repository detail page should provide meaningful information such as:

- repository name
- owner
- what the project does
- concise overview
- features
- categories
- supported technologies/languages
- licence information
- stars
- forks
- repository activity
- creation/update information
- relevant topics
- original GitHub repository link

Do not invent information.

Descriptions and features must be grounded in available GitHub repository data.

### Unique page metadata

Every repository page must have repository-specific metadata.

The page title should be unique and descriptive.

Example:

```text
Crawl4AI — Open-Source AI Web Crawler | FreeLLMAgents
```

Do not use the same generic title for every repository.

Meta descriptions should also be generated from the actual repository information.

Do not create thousands of identical meta descriptions with only the repository name changed.

### Canonical URL

Every repository detail page must have its own canonical URL.

Example:

```text
https://freellmagents.com/agents/crawl4ai/crawl4ai
```

The canonical URL must correspond to the actual repository page.

Do not canonicalise every repository page to `/` or `/agents`.

Avoid duplicate URLs for the same repository where possible.

If multiple URL formats can reach the same repository, choose one canonical format and redirect or otherwise consistently resolve the alternatives.

### Indexability

Repository detail pages are intended to be indexable by search engines when they contain valid repository data.

Do not accidentally add:

```text
noindex
nofollow
```

or equivalent robots directives to repository detail pages.

Keep the site's `robots.txt` and meta robots configuration consistent with the goal of indexing genuine repository pages.

Provide a sitemap (or equivalent discovery mechanism) that includes the permanent URLs of repository detail pages, and keep it updated as repositories are added by the synchronisation process.

Because the frontend is a client-side Vite + React application, ensure repository pages are actually crawlable: use real URL routes with proper `<title>`, meta description, and canonical tags updated per repository, rather than a single static set of tags for the whole site.

---

## 38. Backend Architecture (Implemented)

These decisions were made during the Convex backend implementation and are settled — do not relitigate them:

### Data flow

```text
GitHub REST API → Convex actions (server-side) → Convex database → React frontend
```

The browser never calls GitHub for repository data.

### Convex schema (`convex/schema.ts`)

- `repositories` — one normalised record per GitHub repository, keyed by `githubId` (unique identity). Stores all fields from section 12 plus `searchText` (concatenated name/owner/description/topics/language/summary), `primaryCategory` (first classified category), `lastReadmeFetchedAt`, and `isArchived`.
- Indexes: `by_github_id`, `by_full_name`, `by_stars`, `by_forks`, `by_pushed_at`, `by_first_seen_at`, `by_trend_score`, `by_primary_category`, `by_language`, plus the `search_repo` full-text search index.
- `categoryCounts` / `languageCounts` — maintained counters updated incrementally by the upsert mutation so the sidebar never scans the repository table.
- `syncRuns` — one row per sync run: startedAt, completedAt, status, trigger, discovered/created/updated/skipped/error counts, errorMessage, rateLimited.

### Frontend → Convex

- `main.tsx` wraps the app in `ConvexProvider` (`convex/react`) + `BrowserRouter`. `VITE_CONVEX_URL` is required; the app fails fast with a clear message when it is missing.
- Routes: `/` (HomePage) and `/agents/:owner/:repo` (RepositoryDetailPage, per section 37).
- Queries (`convex/repos.ts`): `list` (search/category/language/sort/pagination — text search via `searchIndex`, ordered browsing via per-field indexes), `getByOwnerName`, `categoryCounts`, `languages`, `latestSync`, `totalCount`.
- All mock repository data was removed. The UI renders skeleton cards while Convex data loads and an empty state when nothing matches.
- Tabs: All/Popular → stars, New → `firstSeenAt`, Trending → `trendScore`. Sidebar sort maps: Recently Updated → `pushedAt`.

### GitHub sync (`convex/sync.ts`, `convex/github.ts`, `convex/discovery.ts`)

- Discovery: 19 fixed search seed queries derived from section 7's discovery groups, one page (30 repos, sorted by stars) per query per run. One failed query does not abort the run.
- GitHub access uses `fetch` against the REST API in `convex/github.ts` (server-side only). `GITHUB_TOKEN` is read from Convex env via `process.env.GITHUB_TOKEN` (set with `npx convex env set GITHUB_TOKEN ...`). Without a token the unauthenticated limits (60 req/h core) apply and README fetches are throttled.
- Rate limiting: on 403/429 with `x-ratelimit-remaining: 0` the run stops, records `rateLimited`, and waits for the next scheduled run. No retry loops.
- Classification (`convex/classification.ts`): evidence-based keyword/topic rules per category with negative terms (games, bots, crypto, malware). A repo needs genuine agent signals, not just "AI". Repos may belong to multiple categories; the first becomes `primaryCategory`. `isOpenSource`/`isFree` come from the license SPDX (whitelist of OSI licenses); unknown license ⇒ no open-source claim.
- README: fetched only when missing or older than 7 days (`lastReadmeFetchedAt`). `convex/summarize.ts` deterministically extracts an overview paragraph and up to 6 bullet features. Failure leaves the record with metadata only.
- Trend score (deterministic, documented): `trendScore = (stars + 2 * forks) / (1 + days since last push)`, computed from stored GitHub data.
- Upserts are idempotent by `githubId` — running sync twice updates, never duplicates. Category/language counter tables are adjusted incrementally on changes.

### Scheduling (`convex/crons.ts`)

Hourly sync via Convex cron at minute 7 past the hour (UTC), trigger "cron". Initial sync: `npx convex run sync:triggerSync` (internal action, trigger "manual" — internal so anonymous visitors cannot burn GitHub API quota). The dev-only "Run sync now" button was removed for the same reason.

### Environment variables

- `VITE_CONVEX_URL` — client-safe Convex deployment URL (set in `.env.local`; `npx convex dev` writes it).
- `GITHUB_TOKEN` — server-side only, stored in Convex env, never in `VITE_*` vars or client code. `.env.example` documents both.

### Convex type generation

`convex/_generated/` files are generated by Convex and are real codegen now (the placeholder stubs were removed). Do not hand-edit them. `tsc -b` type-checks the Convex files transitively through src imports; `tsconfig.app.json` includes the `node` type package because Convex server code reads `process.env`.

### Sitemap

`npm run build` runs `scripts/generate-sitemap.mjs` after the Vite build: it queries `repos:sitemapRepos` over the Convex HTTP API using `VITE_CONVEX_URL` and writes `dist/sitemap.xml` alongside `public/robots.txt` for indexing (best-effort — skipped with a warning when the deployment is unreachable).

### Known limitation

Until `npx convex dev` is run (interactive Convex login required), the site renders an error-boundary state explaining that the backend isn't connected.

### SEO implementation

- `src/hooks/useSeo.ts` is the single SEO hook: sets title, meta description, canonical (`https://freellmagents.com` origin hard-coded), Open Graph, Twitter card (`summary_large_image`, default image `/og-image.png`), `robots` (noindex support), and JSON-LD. Cleanup restores site defaults and removes the page canonical.
- Homepage: `WebSite` JSON-LD with a working `SearchAction` — HomePage reads `?q=` on mount to pre-fill search.
- Repository pages: `SoftwareSourceCode` + `BreadcrumbList` JSON-LD generated only from stored repository data (no invented fields); title is `<name> — <primary category label> | FreeLLMAgents`; not-found repos render a 404 page with `noindex, follow`, h1 "Repository not found", and are never in the sitemap.
- `public/og-image.png` (1200×630) is the default social image.
- Search/filter state is React-only (no URL params), so no duplicate indexable URLs exist; canonical is always the clean path.
- `scripts/generate-sitemap.mjs` XML-escapes and dedupes paths; still fails gracefully when Convex is unreachable.
- Fonts load non-render-blocking (`media="print"` + `onload` swap with `<noscript>` fallback).
- Known limitation: SPA — crawlers that execute JS see per-page metadata; non-JS crawlers see the static index.html defaults. Prerendering would be the next step if raw-HTML crawlability becomes necessary.
