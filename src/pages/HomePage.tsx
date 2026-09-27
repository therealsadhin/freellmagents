import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { TopBar } from '../components/TopBar'
import { Sidebar } from '../components/Sidebar'
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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

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

  // Debounce search input (AGENTS.md section 15).
  const [debouncedSearch, setDebouncedSearch] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 250)
    return () => clearTimeout(timer)
  }, [search])

  const categoryCountsRecord = useQuery(api.repos.categoryCounts, {}) ?? {}
  const languagesQuery = useQuery(api.repos.languages, {})
  const totalCountQuery = useQuery(api.repos.totalCount, {})
  const latestSync = useQuery(api.repos.latestSync, {})

  const repositoriesResult = useQuery(api.repos.list, {
    search: debouncedSearch || undefined,
    category: activeCategory === 'all' ? undefined : activeCategory,
    language: language === 'All Languages' ? undefined : language,
    sort: activeSort,
    numItems: 24,
  })

  const repos = repositoriesResult?.items ?? []

  const isEmpty = useMemo(
    () => repositoriesResult !== undefined && repos.length === 0,
    [repositoriesResult, repos.length],
  )

  return (
    <div className="app">
      <TopBar
        search={search}
        onSearchChange={setSearch}
        onToggleSidebar={() => setSidebarOpen((open) => !open)}
        searchRef={searchRef}
      />

      <div className="app-body">
        <Sidebar
          activeCategory={activeCategory}
          onCategoryChange={(id) => {
            setActiveCategory(id)
            setSidebarOpen(false)
          }}
          activeSort={activeSort}
          onSortChange={setActiveSort}
          language={language}
          onLanguageChange={setLanguage}
          languages={languagesQuery ?? []}
          counts={categoryCountsRecord}
          totalCount={totalCountQuery ?? 0}
          open={sidebarOpen}
        />
        {sidebarOpen && (
          <button
            type="button"
            className="sidebar-backdrop"
            aria-label="Close navigation menu"
            onClick={() => setSidebarOpen(false)}
          />
        )}

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
            <button type="button" className="filters-button">
              <FilterIcon size={16} />
              Filters
            </button>
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
            <section className="repo-grid" aria-label="Repositories">
                {repos.map((repo: RepoDoc) => (
                <RepositoryCard key={repo._id} repo={repo} />
              ))}
            </section>
          )}
        </main>
      </div>
    </div>
  )
}
