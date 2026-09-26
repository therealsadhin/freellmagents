import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  repositories: defineTable({
    githubId: v.number(),
    owner: v.string(),
    name: v.string(),
    fullName: v.string(),
    htmlUrl: v.string(),
    description: v.optional(v.string()),
    readmeSummary: v.optional(v.string()),
    features: v.array(v.string()),
    license: v.optional(v.string()),
    primaryLanguage: v.optional(v.string()),
    languages: v.array(v.string()),
    topics: v.array(v.string()),
    stars: v.number(),
    forks: v.number(),
    openIssues: v.number(),
    watchers: v.number(),
    githubCreatedAt: v.number(),
    githubUpdatedAt: v.number(),
    pushedAt: v.number(),
    firstSeenAt: v.number(),
    lastSyncedAt: v.number(),
    lastReadmeFetchedAt: v.optional(v.number()),
    categories: v.array(v.string()),
    primaryCategory: v.string(),
    isRelevant: v.boolean(),
    isOpenSource: v.optional(v.boolean()),
    isFree: v.optional(v.boolean()),
    trendScore: v.number(),
    isArchived: v.boolean(),
    searchText: v.string(),
  })
    .index('by_github_id', ['githubId'])
    .index('by_full_name', ['fullName'])
    .index('by_stars', ['stars'])
    .index('by_forks', ['forks'])
    .index('by_pushed_at', ['pushedAt'])
    .index('by_first_seen_at', ['firstSeenAt'])
    .index('by_trend_score', ['trendScore'])
    .index('by_primary_category', ['primaryCategory'])
    .index('by_language', ['primaryLanguage'])
    .searchIndex('search_repo', {
      searchField: 'searchText',
      filterFields: ['primaryLanguage', 'isRelevant'],
    }),

  // Maintained counters so the sidebar can show per-category totals
  // without scanning the repositories table.
  categoryCounts: defineTable({
    categoryId: v.string(),
    count: v.number(),
  }).index('by_category_id', ['categoryId']),

  // Distinct primary languages and how many repositories use each.
  languageCounts: defineTable({
    language: v.string(),
    count: v.number(),
  }).index('by_language_name', ['language']),

  // One row per sync run for monitoring (AGENTS.md section 19/23).
  syncRuns: defineTable({
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    status: v.string(), // "running" | "completed" | "failed"
    trigger: v.string(), // "cron" | "manual"
    discoveredCount: v.number(),
    createdCount: v.number(),
    updatedCount: v.number(),
    skippedCount: v.number(),
    errorCount: v.number(),
    errorMessage: v.optional(v.string()),
    rateLimited: v.boolean(),
  }),
})
