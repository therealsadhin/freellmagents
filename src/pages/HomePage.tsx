import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { TopBar } from '../components/TopBar'
import { FilterPanel } from '../components/Sidebar'
import { RepositoryCard } from '../components/RepositoryCard'
import { FilterIcon } from '../components/Icons'
import { tabSorts, tabs } from '../categories'
import { useSeo } from '../hooks/useSeo'
import { formatRelative } from '../utils/format'
import type { RepoDoc } from '../../convex/repos'

export function HomePage() {
  // Accept ?q= so external/search-engine SearchAction URLs pre-fill search.
  const [search, setSearch] = useState(() => {
    const q = new URLSearchParams(window.location.search).get('q')
    return q ? q.slice(0, 200) : ''
  })
  const [activeCategory, setActiveCategory] = useState('all')
  const [activeSort, setActiveSort] = useState('stars')
  const [activeTab, setActiveTab] = useState('All')
  const [language, setLanguage] = useState('All Languages')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const filtersRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  // Cursor stack for page-based navigation: last entry is the current page.
  const [cursorStack, setCursorStack] = useState<string[]>([])

  useSeo({
    title: 'Free AI Agents & Open Source AI Tools | FreeLLMAgents',
    description:
      'Discover, search and explore the best free and open-source AI and LLM agent repositories on GitHub — browse by category, language and popularity.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'FreeLLMAgents',
      url: 'https://freellmagents.com/',
      description:
        'A public directory of free and open-source AI, LLM and agent-related GitHub repositories.',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://freellmagents.com/?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
  })

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (!filtersOpen) return
    const onPointerDown = (event: PointerEvent) => {
      if (!filtersRef.current?.contains(event.target as Node)) {
        setFiltersOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFiltersOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [filtersOpen])

  // Debounce search input (AGENTS.md section 15).
  const [debouncedSearch, setDebouncedSearch] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 250)
    return () => clearTimeout(timer)
  }, [search])

  // Reset to page 1 whenever any listing input changes.
  const filterKey = `${debouncedSearch}|${activeCategory}|${language}|${activeSort}`
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey)
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey)
    setCursorStack([])
  }

  // Bring the top of the grid into view when moving between pages.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [cursorStack.length])

  const categoryCountsRecord = useQuery(api.repos.categoryCounts, {}) ?? {}
  const languagesQuery = useQuery(api.repos.languages, {})
  const totalCountQuery = useQuery(api.repos.totalCount, {})
  const latestSync = useQuery(api.repos.latestSync, {})

  const repositoriesResult = useQuery(api.repos.list, {
    search: debouncedSearch || undefined,
    category: activeCategory === 'all' ? undefined : activeCategory,
    language: language === 'All Languages' ? undefined : language,
    sort: activeSort,
    cursor: cursorStack.length > 0 ? cursorStack[cursorStack.length - 1] : undefined,
    numItems: 24,
  })

  const repos = repositoriesResult?.items ?? []

  const isEmpty = useMemo(
    () => repositoriesResult !== undefined && repos.length === 0,
    [repositoriesResult, repos.length],
  )

  return (
    <div className="app">
      <TopBar search={search} onSearchChange={setSearch} searchRef={searchRef} />

      <div className="app-body">
        <main className="main">
          <div className="main__glow" aria-hidden />

          <section className="hero">
            <p className="hero__eyebrow">Explore GitHub Repositories</p>
            <h1 className="hero__title">
              Discover Amazing
              <br />
              <span className="hero__title-accent">
                Open Source Repositories
              </span>
            </h1>
            <p className="hero__subtitle">
              Browse, search and explore the best GitHub repositories — all in
              one place.
              <br />
              Find tools, projects and ideas to build something great.
            </p>
            <p className="hero__note" aria-hidden>
              Open source builds a better future &rarr;
            </p>
          </section>

          <div className="toolbar">
            <div
              className="toolbar__tabs"
              role="group"
              aria-label="Quick filters"
            >
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className="chip"
                  aria-pressed={activeTab === tab}
                  onClick={() => {
                    setActiveTab(tab)
                    setActiveSort(tabSorts[tab] ?? 'stars')
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="filters" ref={filtersRef}>
              <button
                type="button"
                className="filters-button"
                aria-haspopup="true"
                aria-expanded={filtersOpen}
                onClick={() => setFiltersOpen((open) => !open)}
              >
                <FilterIcon size={16} />
                Filters
              </button>
              {filtersOpen && (
                <div className="filters__dropdown">
                  <FilterPanel
                    activeCategory={activeCategory}
                    onCategoryChange={(id) => {
                      setActiveCategory(id)
                      setFiltersOpen(false)
                    }}
                    activeSort={activeSort}
                    onSortChange={setActiveSort}
                    language={language}
                    onLanguageChange={setLanguage}
                    languages={languagesQuery ?? []}
                    counts={categoryCountsRecord}
                    totalCount={totalCountQuery ?? 0}
                  />
                </div>
              )}
            </div>
          </div>

          {latestSync?.completedAt && (
            <p className="sync-note">
              Directory last updated {formatRelative(latestSync.completedAt)}
            </p>
          )}

          {repositoriesResult === undefined ? (
            <>
              {/* aria-label is not permitted on a generic div; the loading
                  status lives in the visually-hidden live region instead. */}
              <div className="sr-only" role="status">
                Loading repositories
              </div>
              <div className="repo-grid" aria-hidden>
                {Array.from({ length: 9 }).map((_, index) => (
                  <div key={index} className="repo-card repo-card--skeleton" />
                ))}
              </div>
            </>
          ) : isEmpty ? (
            <div className="empty">
              <h3>No repositories found</h3>
              <p>
                Try a different search term, language or category — or clear
                your filters.
              </p>
            </div>
          ) : (
            <>
              <section className="repo-grid" aria-label="Repositories">
                {repos.map((repo: RepoDoc) => (
                  <RepositoryCard key={repo._id} repo={repo} />
                ))}
              </section>
              <nav className="pagination" aria-label="Pagination">
                <button
                  type="button"
                  className="pagination__button"
                  disabled={cursorStack.length === 0}
                  onClick={() =>
                    setCursorStack((stack) => stack.slice(0, -1))
                  }
                >
                  &larr; Prev
                </button>
                <span className="pagination__page" aria-current="page">
                  Page {cursorStack.length + 1}
                </span>
                <button
                  type="button"
                  className="pagination__button"
                  disabled={
                    repositoriesResult.isDone || !repositoriesResult.cursor
                  }
                  onClick={() =>
                    repositoriesResult.cursor &&
                    setCursorStack((stack) => [
                      ...stack,
                      repositoriesResult.cursor!,
                    ])
                  }
                >
                  Next &rarr;
                </button>
              </nav>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
