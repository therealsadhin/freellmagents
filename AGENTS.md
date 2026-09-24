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
