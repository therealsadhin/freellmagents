import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { TopBar } from '../components/TopBar'
import { RepoAvatar } from '../components/RepositoryCard'
import { StarIcon, ForkIcon, ArrowUpRightIcon, ClockIcon } from '../components/Icons'
import { useSeo } from '../hooks/useSeo'
import { formatCount, formatDate, formatRelative } from '../utils/format'
import { categories } from '../categories'

function titleCase(id: string): string {
  return (
    categories.find((category) => category.id === id)?.label ??
    id.replace(/-/g, ' ')
  )
}

export function RepositoryDetailPage() {
  const { owner = '', repo: repoName = '' } = useParams()
  const repo = useQuery(api.repos.getByOwnerName, {
    owner,
    name: repoName,
  })
  // Related repositories give detail pages real internal links (SEO-AUDIT.md
  // issue 5). Skipped until the current repo is loaded.
  const related = useQuery(
    api.repos.related,
    repo ? { primaryCategory: repo.primaryCategory, excludeId: repo._id } : 'skip',
  )

  const canonicalPath = `/agents/${owner}/${repoName}`
  const notFound = repo === null

  const title = repo
    ? `${repo.name} — ${categories.find((c) => c.id === repo.primaryCategory)?.label ?? 'Open Source GitHub Repository'} | FreeLLMAgents`
    : notFound
      ? 'Repository not found | FreeLLMAgents'
      : 'Repository | FreeLLMAgents'

  const description = repo
    ? (repo.description ??
      repo.readmeSummary ??
      `${repo.name} by ${repo.owner} — open-source GitHub repository.`)
    : notFound
      ? `${owner}/${repoName} was not found in the FreeLLMAgents directory.`
      : `${owner}/${repoName} — free and open-source GitHub repository on FreeLLMAgents.`

  const jsonLd = useMemo(() => {
    if (!repo) return undefined
    const data: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareSourceCode',
      name: repo.name,
      description:
        repo.description ?? repo.readmeSummary ?? undefined,
      url: `https://freellmagents.com/agents/${repo.owner}/${repo.name}`,
      codeRepository: repo.htmlUrl,
      identifier: repo.fullName,
      programmingLanguage: repo.primaryLanguage ?? undefined,
      keywords: repo.topics.length > 0 ? repo.topics.join(', ') : undefined,
      author: { '@type': 'Person', name: repo.owner },
      license: repo.isOpenSource
        ? `https://spdx.org/licenses/${repo.license}.html`
        : undefined,
    }
    if (repo.description == null && repo.readmeSummary == null) {
      delete data.description
    }
    return [
      data,
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Repositories',
            item: 'https://freellmagents.com/',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: repo.fullName,
            item: `https://freellmagents.com/agents/${repo.owner}/${repo.name}`,
          },
        ],
      },
    ]
  }, [repo])

  useSeo({
    title,
    description,
    canonicalPath,
    noindex: notFound,
    jsonLd,
  })

  return (
    <div className="app">
      <TopBar
        search=""
        onSearchChange={() => {}}
        searchRef={{ current: null }}
      />

      <main className="main detail">
        {repo === undefined ? (
          <p className="detail__loading">Loading repository…</p>
        ) : repo === null ? (
          <div className="empty detail__empty">
            <h1>Repository not found</h1>
            <p>
              We don't have <strong>{owner}/{repoName}</strong> in the directory
              yet. It may not have been discovered by our sync, or it may not be
              relevant.
            </p>
            <Link className="detail__back" to="/">
              &larr; Back to all repositories
            </Link>
          </div>
        ) : (
          <>
            <Link className="detail__back-button" to="/">
              &larr; Back to repositories
            </Link>
            <nav className="detail__breadcrumb" aria-label="Breadcrumb">
              <Link to="/">Repositories</Link>
              <span aria-hidden> / </span>
              <span>
                {repo.owner}/{repo.name}
              </span>
            </nav>

            <header className="detail__header">
              <RepoAvatar repo={repo} />
              <div className="detail__heading">
                <h1>{repo.name}</h1>
                <p className="detail__owner">by {repo.owner}</p>
              </div>
              <a
                className="detail__github"
                href={repo.htmlUrl}
                target="_blank"
                rel="noreferrer"
              >
                View on GitHub
                <ArrowUpRightIcon size={16} />
              </a>
            </header>

            {repo.description && (
              <p className="detail__description">{repo.description}</p>
            )}

            <div className="detail__layout">
              <div className="detail__body">
                <section>
                  <h2>Overview</h2>
                  <p>
                    {repo.readmeSummary ??
                      repo.description ??
                      'This repository does not include an overview yet. See the GitHub repository for details.'}
                  </p>
                </section>

                {repo.features.length > 0 && (
                  <section>
                    <h2>Features</h2>
                    <ul className="detail__features">
                      {repo.features.map((feature: string) => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>
                  </section>
                )}

                <section>
                  <h2>Topics</h2>
                  {repo.topics.length > 0 ? (
                    <div className="repo-card__tags">
                      {repo.topics.map((topic: string) => (
                        <span key={topic} className="tag">
                          {topic}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="detail__muted">No topics specified.</p>
                  )}
                </section>

                {related && related.length > 0 && (
                  <section>
                    <h2>Related repositories</h2>
                    <ul className="detail__related">
                      {related.map((relatedRepo) => (
                        <li key={`${relatedRepo.owner}/${relatedRepo.name}`}>
                          <Link
                            to={`/agents/${relatedRepo.owner}/${relatedRepo.name}`}
                          >
                            {relatedRepo.owner}/{relatedRepo.name}
                          </Link>
                          {relatedRepo.description && (
                            <span className="detail__muted">
                              {' '}
                              — {relatedRepo.description}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>

              <aside className="detail__sidebar">
                <section>
                  <h2>Metadata</h2>
                  <dl className="detail__meta">
                    <div>
                      <dt>Stars</dt>
                      <dd>
                        <StarIcon size={14} /> {formatCount(repo.stars)}
                      </dd>
                    </div>
                    <div>
                      <dt>Forks</dt>
                      <dd>
                        <ForkIcon size={14} /> {formatCount(repo.forks)}
                      </dd>
                    </div>
                    <div>
                      <dt>Primary language</dt>
                      <dd>{repo.primaryLanguage ?? 'Not specified'}</dd>
                    </div>
                    <div>
                      <dt>License</dt>
                      <dd>{repo.license ?? 'License not specified'}</dd>
                    </div>
                    <div>
                      <dt>Categories</dt>
                      <dd>{repo.categories.map(titleCase).join(', ')}</dd>
                    </div>
                    <div>
                      <dt>Last updated on GitHub</dt>
                      <dd>
                        <ClockIcon size={14} /> {formatRelative(repo.pushedAt)}
                      </dd>
                    </div>
                    <div>
                      <dt>Created</dt>
                      <dd>{formatDate(repo.githubCreatedAt)}</dd>
                    </div>
                    <div>
                      <dt>Open source</dt>
                      <dd>
                        {repo.isOpenSource
                          ? `Yes (${repo.license})`
                          : 'Not determined from license data'}
                      </dd>
                    </div>
                  </dl>
                </section>
              </aside>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
