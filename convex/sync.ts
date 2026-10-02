import { v } from 'convex/values'
import {
  internalMutation,
  internalAction,
  internalQuery,
} from './_generated/server'
import { internal } from './_generated/api'
import type { Doc } from './_generated/dataModel'
import {
  searchRepositories,
  getReadme,
  RateLimitError,
  type GitHubRepo,
} from './github'
import { classify, isOpenSource, trendScore } from './classification'
import { DISCOVERY_QUERIES } from './discovery'
import { summariseReadme } from './summarize'

const README_REFRESH_MS = 7 * 24 * 60 * 60 * 1000 // refresh weekly at most

function buildSearchText(repo: {
  owner: string
  name: string
  description?: string
  topics: string[]
  primaryLanguage?: string
  readmeSummary?: string
}): string {
  return [
    repo.owner,
    repo.name,
    repo.description ?? '',
    repo.topics.join(' '),
    repo.primaryLanguage ?? '',
    repo.readmeSummary ?? '',
  ]
    .join(' ')
    .toLowerCase()
    .slice(0, 4000)
}

/** Upsert one repository; returns "created" | "updated" | "skipped". */
export const upsertRepository = internalMutation({
  args: {
    repo: v.any(),
    categories: v.array(v.string()),
    readmeSummary: v.optional(v.string()),
    features: v.array(v.string()),
    now: v.number(),
  },
  handler: async (ctx, args): Promise<'created' | 'updated' | 'skipped'> => {
    const gh = args.repo as GitHubRepo
    const existing = await ctx.db
      .query('repositories')
      .withIndex('by_github_id', (q) => q.eq('githubId', gh.id))
      .first()

    const languages = [
      ...new Set(
        [gh.language, ...(gh.topics ?? []).filter(() => false)].filter(
          (l): l is string => !!l,
        ),
      ),
    ]

    const licenseSpdx =
      gh.license?.spdx_id && gh.license.spdx_id !== 'NOASSERTION'
        ? gh.license.spdx_id
        : undefined

    if (existing) {
      // Keep stored summary/features if we didn't refetch the README.
      const readmeSummary = args.readmeSummary ?? existing.readmeSummary
      const features = args.features.length > 0 ? args.features : existing.features
      const classification = classify(gh)
      const categories = [
        ...new Set([...args.categories, ...classification.categories]),
      ]
      const primaryCategory = categories[0] ?? existing.primaryCategory

      const categoryChanged =
        JSON.stringify(categories) !== JSON.stringify(existing.categories)
      const languageChanged = gh.language !== existing.primaryLanguage

      ctx.db.patch(existing._id, {
        owner: gh.owner.login,
        name: gh.name,
        fullName: gh.full_name,
        htmlUrl: gh.html_url,
        description: gh.description ?? undefined,
        license: licenseSpdx,
        primaryLanguage: gh.language ?? undefined,
        languages,
        topics: gh.topics ?? [],
        stars: gh.stargazers_count,
        forks: gh.forks_count,
        openIssues: gh.open_issues_count,
        watchers: gh.watchers_count,
        githubCreatedAt: new Date(gh.created_at).getTime(),
        githubUpdatedAt: new Date(gh.updated_at).getTime(),
        pushedAt: new Date(gh.pushed_at).getTime(),
        lastSyncedAt: args.now,
        categories,
        primaryCategory,
        isRelevant: true,
        isOpenSource: isOpenSource(gh),
        isFree: isOpenSource(gh),
        trendScore: trendScore(gh, args.now),
        isArchived: gh.archived,
        readmeSummary,
        features,
        searchText: buildSearchText({
          owner: gh.owner.login,
          name: gh.name,
          description: gh.description ?? undefined,
          topics: gh.topics ?? [],
          primaryLanguage: gh.language ?? undefined,
          readmeSummary: readmeSummary ?? undefined,
        }),
      })

      if (categoryChanged) adjustCategoryCounts(ctx, existing, categories)
      if (languageChanged) adjustLanguageCounts(ctx, existing, gh.language ?? undefined)
      return 'updated'
    }

    const classification = classify(gh)
    const categories = [
      ...new Set([...args.categories, ...classification.categories]),
    ]

    const doc = {
      githubId: gh.id,
      owner: gh.owner.login,
      name: gh.name,
      fullName: gh.full_name,
      htmlUrl: gh.html_url,
      description: gh.description ?? undefined,
      license: licenseSpdx,
      primaryLanguage: gh.language ?? undefined,
      languages,
      topics: gh.topics ?? [],
      stars: gh.stargazers_count,
      forks: gh.forks_count,
      openIssues: gh.open_issues_count,
      watchers: gh.watchers_count,
      githubCreatedAt: new Date(gh.created_at).getTime(),
      githubUpdatedAt: new Date(gh.updated_at).getTime(),
      pushedAt: new Date(gh.pushed_at).getTime(),
      firstSeenAt: args.now,
      lastSyncedAt: args.now,
      categories,
      primaryCategory: categories[0] ?? 'ai-llm-agents',
      isRelevant: true,
      isOpenSource: isOpenSource(gh),
      isFree: isOpenSource(gh),
      trendScore: trendScore(gh, args.now),
      isArchived: gh.archived,
      readmeSummary: args.readmeSummary,
      features: args.features,
      searchText: buildSearchText({
        owner: gh.owner.login,
        name: gh.name,
        description: gh.description ?? undefined,
        topics: gh.topics ?? [],
        primaryLanguage: gh.language ?? undefined,
        readmeSummary: args.readmeSummary,
      }),
    }

    await ctx.db.insert('repositories', doc)
    adjustCategoryCounts(ctx, null, categories)
    adjustLanguageCounts(ctx, null, gh.language ?? undefined)
    // Maintain the total-directory counter used by repos.totalCount.
    await bumpCategory(ctx, 'all', +1)
    return 'created'
  },
})

function adjustCategoryCounts(
  ctx: { db: any },
  existing: Doc<'repositories'> | null,
  newCategories: string[],
) {
  const old: Set<string> = existing
    ? new Set(existing.categories)
    : new Set()
  const next = new Set(newCategories)
  for (const id of old) if (!next.has(id)) bumpCategory(ctx, id, -1)
  for (const id of next) if (!old.has(id)) bumpCategory(ctx, id, +1)
}

async function bumpCategory(ctx: { db: any }, categoryId: string, delta: number) {
  const row = await ctx.db
    .query('categoryCounts')
    .withIndex('by_category_id', (q: any) => q.eq('categoryId', categoryId))
    .first()
  if (row) {
    ctx.db.patch(row._id, { count: Math.max(0, row.count + delta) })
  } else if (delta > 0) {
    await ctx.db.insert('categoryCounts', { categoryId, count: delta })
  }
}

function adjustLanguageCounts(
  ctx: { db: any },
  existing: Doc<'repositories'> | null,
  newLanguage: string | undefined,
) {
  if (existing?.primaryLanguage) bumpLanguage(ctx, existing.primaryLanguage, -1)
  if (newLanguage) bumpLanguage(ctx, newLanguage, +1)
}

async function bumpLanguage(ctx: { db: any }, language: string, delta: number) {
  const row = await ctx.db
    .query('languageCounts')
    .withIndex('by_language_name', (q: any) => q.eq('language', language))
    .first()
  if (row) {
    ctx.db.patch(row._id, { count: Math.max(0, row.count + delta) })
  } else if (delta > 0) {
    await ctx.db.insert('languageCounts', { language, count: delta })
  }
}

/** Full sync run: discovery search -> classify -> upsert. */
export const runSync = internalAction({
  args: { trigger: v.string() },
  handler: async (ctx, args) => {
    const startedAt = Date.now()
    const runId = await ctx.runMutation(internal.sync.startRun, {
      startedAt,
      trigger: args.trigger,
    })

    const token = process.env.GITHUB_TOKEN
    let discovered = 0
    let created = 0
    let updated = 0
    let skipped = 0
    let errors = 0
    let rateLimited = false
    let errorMessage: string | undefined

    try {
      outer: for (const { query, category } of DISCOVERY_QUERIES) {
        let repos: GitHubRepo[]
        try {
          repos = await searchRepositories(query, token)
        } catch (error) {
          if (error instanceof RateLimitError) {
            rateLimited = true
            errorMessage = `Rate limited during "${query}", reset at ${new Date(error.resetAt).toISOString()}`
            break outer
          }
          errors += 1
          continue // one failed query must not abort the sync
        }

        for (const repo of repos) {
          discovered += 1
          try {
            const classification = classify(repo)
            if (!classification.isRelevant || repo.archived) {
              skipped += 1
              continue
            }

            // README only when missing or stale, to save rate limit.
            const existing = await ctx.runQuery(internal.sync.getExisting, {
              githubId: repo.id,
            })
            let readmeSummary: string | undefined
            let features: string[] = []
            const needsReadme =
              !existing ||
              !existing.lastReadmeFetchedAt ||
              Date.now() - existing.lastReadmeFetchedAt > README_REFRESH_MS
            if (needsReadme) {
              const readme = await getReadme(
                repo.owner.login,
                repo.name,
                token,
              )
              if (readme) {
                const summary = summariseReadme(readme)
                readmeSummary = summary.overview || repo.description || undefined
                features = summary.features
              }
              // Unauthenticated GitHub core limit is 60/h; pace README fetches.
              if (!token) {
                await new Promise((resolve) => setTimeout(resolve, 1200))
              }
            }

            const result = await ctx.runMutation(internal.sync.upsertRepository, {
              repo,
              categories: [category],
              readmeSummary,
              features,
              now: Date.now(),
            })
            if (result === 'created') created += 1
            else if (result === 'updated') updated += 1

            if (result !== 'skipped' && needsReadme) {
              await ctx.runMutation(internal.sync.markReadmeFetched, {
                githubId: repo.id,
                at: Date.now(),
              })
            }
          } catch (error) {
            if (error instanceof RateLimitError) {
              rateLimited = true
              errorMessage = `Rate limited at repo ${repo.full_name}`
              break outer
            }
            errors += 1
          }
        }
      }

      await ctx.runMutation(internal.sync.finishRun, {
        runId,
        completedAt: Date.now(),
        status: rateLimited ? 'failed' : 'completed',
        discoveredCount: discovered,
        createdCount: created,
        updatedCount: updated,
        skippedCount: skipped,
        errorCount: errors,
        errorMessage,
        rateLimited,
      })
    } catch (error) {
      await ctx.runMutation(internal.sync.finishRun, {
        runId,
        completedAt: Date.now(),
        status: 'failed',
        discoveredCount: discovered,
        createdCount: created,
        updatedCount: updated,
        skippedCount: skipped,
        errorCount: errors + 1,
        errorMessage: String(error),
        rateLimited,
      })
      throw error
    }
  },
})

export const startRun = internalMutation({
  args: { startedAt: v.number(), trigger: v.string() },
  handler: async (ctx, args) =>
    ctx.db.insert('syncRuns', {
      startedAt: args.startedAt,
      status: 'running',
      trigger: args.trigger,
      discoveredCount: 0,
      createdCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      errorCount: 0,
      rateLimited: false,
    }),
})

export const finishRun = internalMutation({
  args: {
    runId: v.id('syncRuns'),
    completedAt: v.number(),
    status: v.string(),
    discoveredCount: v.number(),
    createdCount: v.number(),
    updatedCount: v.number(),
    skippedCount: v.number(),
    errorCount: v.number(),
    errorMessage: v.optional(v.string()),
    rateLimited: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { runId, ...updates } = args
    ctx.db.patch(runId, updates)
  },
})

export const getExisting = internalQuery({
  args: { githubId: v.number() },
  handler: async (ctx, args) =>
    ctx.db
      .query('repositories')
      .withIndex('by_github_id', (q) => q.eq('githubId', args.githubId))
      .first(),
})

export const markReadmeFetched = internalMutation({
  args: { githubId: v.number(), at: v.number() },
  handler: async (ctx, args) => {
    const repo = await ctx.db
      .query('repositories')
      .withIndex('by_github_id', (q) => q.eq('githubId', args.githubId))
      .first()
    if (repo) ctx.db.patch(repo._id, { lastReadmeFetchedAt: args.at })
  },
})

/**
 * Manual trigger for the initial sync. Internal so anonymous visitors cannot
 * burn GitHub API quota (AGENTS.md section 26); run it with
 * `npx convex run sync:triggerSync` or from the Convex dashboard.
 */
export const triggerSync = internalAction({
  args: {},
  handler: async (ctx) => {
    await ctx.runAction(internal.sync.runSync, { trigger: 'manual' })
  },
})

/**
 * One-off backfill: re-run classification over every stored repository and
 * patch categories/primaryCategory plus the maintained counters. Used when
 * CATEGORY_RULES gain new categories (e.g. skills, ai-models). Does not touch
 * GitHub; pure database reclassification.
 */
export const reclassifyAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query('repositories').collect()
    let updated = 0
    for (const row of rows) {
      const classification = classify({
        name: row.name,
        description: row.description,
        topics: row.topics,
      } as GitHubRepo)
      const categories = classification.isRelevant
        ? [...new Set([...row.categories, ...classification.categories])]
        : row.categories
      if (JSON.stringify(categories) !== JSON.stringify(row.categories)) {
        ctx.db.patch(row._id, {
          categories,
          primaryCategory: categories[0] ?? row.primaryCategory,
        })
        adjustCategoryCounts(ctx, row, categories)
        updated += 1
      }
    }
    return { total: rows.length, updated }
  },
})

/**
 * One-off maintenance: rebuild categoryCounts and languageCounts from the
 * actual repository rows, in case the incrementally-maintained counters
 * drifted (e.g. across backfills).
 */
export const rebuildCounters = internalMutation({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query('repositories').collect()
    for (const row of await ctx.db.query('categoryCounts').collect()) {
      ctx.db.delete(row._id)
    }
    for (const row of await ctx.db.query('languageCounts').collect()) {
      ctx.db.delete(row._id)
    }
    const categoryCounts = new Map<string, number>()
    const languageCounts = new Map<string, number>()
    for (const row of rows) {
      for (const id of row.categories) {
        categoryCounts.set(id, (categoryCounts.get(id) ?? 0) + 1)
      }
      if (row.primaryLanguage) {
        languageCounts.set(
          row.primaryLanguage,
          (languageCounts.get(row.primaryLanguage) ?? 0) + 1,
        )
      }
    }
    for (const [categoryId, count] of categoryCounts) {
      await ctx.db.insert('categoryCounts', { categoryId, count })
    }
    for (const [language, count] of languageCounts) {
      await ctx.db.insert('languageCounts', { language, count })
    }
    return { repos: rows.length, categories: categoryCounts.size }
  },
})
