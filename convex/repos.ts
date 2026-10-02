import { v } from 'convex/values'
import { query } from './_generated/server'

export type RepoDoc = {
  _id: string
  githubId: number
  owner: string
  name: string
  fullName: string
  htmlUrl: string
  description?: string
  readmeSummary?: string
  features: string[]
  license?: string
  primaryLanguage?: string
  languages: string[]
  topics: string[]
  stars: number
  forks: number
  openIssues: number
  watchers: number
  githubCreatedAt: number
  githubUpdatedAt: number
  pushedAt: number
  firstSeenAt: number
  lastSyncedAt: number
  categories: string[]
  primaryCategory: string
  isOpenSource?: boolean
  trendScore: number
}

export type SortId = 'stars' | 'forks' | 'pushedAt' | 'firstSeenAt' | 'trendScore'

const SORT_INDEX: Record<
  SortId,
  'by_stars' | 'by_forks' | 'by_pushed_at' | 'by_first_seen_at' | 'by_trend_score'
> = {
  stars: 'by_stars',
  forks: 'by_forks',
  pushedAt: 'by_pushed_at',
  firstSeenAt: 'by_first_seen_at',
  trendScore: 'by_trend_score',
}

/** Main directory listing: search, category, language, sort, pagination. */
export const list = query({
  args: {
    search: v.optional(v.string()),
    category: v.optional(v.string()),
    language: v.optional(v.string()),
    sort: v.optional(v.string()),
    cursor: v.optional(v.string()),
    numItems: v.number(),
  },
  handler: async (ctx, args) => {
    const sort = (args.sort ?? 'stars') as SortId
    const search = args.search?.trim()

    // Text search path (Convex full-text index over name/owner/description/
    // topics/language/summary).
    if (search) {
      const q = ctx.db
        .query('repositories')
        .withSearchIndex('search_repo', (s: any) =>
          args.language && args.language !== 'All Languages'
            ? s
                .search('searchText', search)
                .eq('isRelevant', true)
                .eq('primaryLanguage', args.language!)
            : s.search('searchText', search).eq('isRelevant', true),
        )
      const page = await q.paginate({
        cursor: args.cursor ?? null,
        numItems: args.numItems,
      })
      const items = args.category
        ? page.page.filter((r: any) => r.categories.includes(args.category!))
        : page.page
      return {
        items: sortPage(items, sort),
        cursor: page.continueCursor,
        isDone: page.isDone,
      }
    }

    // Ordered index path.
    // Category filter matches the full categories array (repos can belong to
    // several categories), not just primaryCategory. Bounded collect keeps
    // this server-side and cheap at the current directory size.
    if (args.category && args.category !== 'all') {
      const rows = (
        await ctx.db
          .query('repositories')
          .filter((q: any) => q.eq(q.field('isRelevant'), true))
          .collect()
      ).filter((r: any) => r.categories.includes(args.category!))
      const items = filterByLanguage(rows, args.language).slice(
        0,
        args.numItems,
      )
      return { items: sortPage(items, sort), cursor: null, isDone: true }
    }

    if (args.language && args.language !== 'All Languages') {
      const rows = await ctx.db
        .query('repositories')
        .withIndex('by_language', (q: any) => q.eq('primaryLanguage', args.language!))
        .take(args.numItems * 3)
      return {
        items: sortPage(filterByLanguage(rows, args.language), sort),
        cursor: null,
        isDone: true,
      }
    }

    const page = await ctx.db
      .query('repositories')
      .withIndex(SORT_INDEX[sort] ?? 'by_stars')
      .order('desc')
      .paginate({ cursor: args.cursor ?? null, numItems: args.numItems })

    return {
      items: page.page,
      cursor: page.continueCursor,
      isDone: page.isDone,
    }
  },
})

function filterByLanguage(rows: any[], language?: string): any[] {
  if (!language || language === 'All Languages') return rows
  return rows.filter((r) => r.primaryLanguage === language)
}

// Re-sort post-filtered pages in memory; bounded page sizes keep this cheap.
function sortPage(items: any[], sort: SortId): any[] {
  const key = (
    ['stars', 'forks', 'pushedAt', 'firstSeenAt', 'trendScore'].includes(sort)
      ? sort
      : 'stars'
  ) as SortKey
  return [...items].sort((a, b) => (b[key] ?? 0) - (a[key] ?? 0))
}
type SortKey = 'stars' | 'forks' | 'pushedAt' | 'firstSeenAt' | 'trendScore'

/** Single repository by owner/name for the detail page. */
export const getByOwnerName = query({
  args: { owner: v.string(), name: v.string() },
  handler: async (ctx, args) =>
    ctx.db
      .query('repositories')
      .withIndex('by_full_name', (q: any) =>
        q.eq('fullName', `${args.owner}/${args.name}`),
      )
      .first(),
})

/** Sidebar category counts. */
export const categoryCounts = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query('categoryCounts').collect()
    return Object.fromEntries(rows.map((r: any) => [r.categoryId, r.count]))
  },
})

/** Language dropdown values, most used first. */
export const languages = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query('languageCounts').collect()
    return rows
      .filter((r: any) => r.count > 0)
      .sort((a: any, b: any) => b.count - a.count)
      .map((r: any) => r.language)
  },
})

/** Latest sync run for "data last updated" honesty (AGENTS.md section 25). */
export const latestSync = query({
  args: {},
  handler: async (ctx) => {
    const run = await ctx.db
      .query('syncRuns')
      .order('desc')
      .take(1)
    return run[0] ?? null
  },
})

/** Total relevant repository count, from the maintained "all" counter. */
export const totalCount = query({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db
      .query('categoryCounts')
      .withIndex('by_category_id', (q: any) => q.eq('categoryId', 'all'))
      .first()
    return row?.count ?? 0
  },
})

/**
 * Repository URLs for sitemap generation (AGENTS.md section 37). Called by
 * scripts/generate-sitemap.mjs at build time — one page per repository,
 * capped to keep the sitemap within search-engine limits.
 */
export const sitemapRepos = query({
  args: { cursor: v.optional(v.string()), numItems: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query('repositories')
      .withIndex('by_github_id')
      .paginate({
        cursor: args.cursor ?? null,
        numItems: args.numItems ?? 1000,
      })
    return {
      entries: page.page.map((r: any) => ({
        path: `agents/${r.owner}/${r.name}`,
        name: r.name as string,
        owner: r.owner as string,
        description: (r.description ?? r.readmeSummary ?? '') as string,
        stars: r.stars as number,
      })),
      cursor: page.continueCursor,
      isDone: page.isDone,
    }
  },
})

/** Minimal repository projection for internal links (related repos, llms.txt). */
export type RelatedRepo = Pick<
  RepoDoc,
  'owner' | 'name' | 'description' | 'stars' | 'primaryCategory' | 'primaryLanguage'
>

/**
 * Related repositories: same primary category, most-starred first. Powers the
 * "Related repositories" section on detail pages so repository pages are not
 * reachable only through the paginated homepage (SEO-AUDIT.md issue 5).
 */
export const related = query({
  args: {
    primaryCategory: v.string(),
    excludeId: v.optional(v.id('repositories')),
    numItems: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query('repositories')
      .withIndex('by_primary_category', (q: any) =>
        q.eq('primaryCategory', args.primaryCategory),
      )
      .collect()
    return rows
      .filter(
        (r: any) =>
          r.isRelevant && !r.isArchived && r._id !== args.excludeId,
      )
      .sort((a: any, b: any) => b.stars - a.stars)
      .slice(0, args.numItems ?? 6)
      .map((r: any) => ({
        owner: r.owner,
        name: r.name,
        description: r.description,
        stars: r.stars,
        primaryCategory: r.primaryCategory,
        primaryLanguage: r.primaryLanguage,
      }))
  },
})
