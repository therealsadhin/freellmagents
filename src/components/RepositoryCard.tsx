import { Link } from 'react-router-dom'
import type { RepoDoc } from '../../convex/repos'
import { formatCount, formatRelative } from '../utils/format'
import { ArrowUpRightIcon, StarIcon, ForkIcon } from './Icons'

const AVATAR_COLORS = [
  'linear-gradient(135deg, #6d5ef0, #3b2f8f)',
  'linear-gradient(135deg, #3ecf8e, #17936b)',
  'linear-gradient(135deg, #38bdf8, #0e7490)',
  'linear-gradient(135deg, #8b7ff0, #e05fb2)',
  'linear-gradient(135deg, #f59e0b, #b45309)',
  'linear-gradient(135deg, #f472b6, #9d174d)',
]

export function RepoAvatar({ repo }: { repo: RepoDoc }) {
  const index = repo.githubId % AVATAR_COLORS.length
  return (
    <span
      className="repo-card__avatar"
      style={{ background: AVATAR_COLORS[index] }}
      aria-hidden
    >
      {repo.name.charAt(0).toUpperCase()}
    </span>
  )
}

export function RepositoryCard({ repo }: { repo: RepoDoc }) {
  return (
    <Link className="repo-card" to={`/agents/${repo.owner}/${repo.name}`}>
      <div className="repo-card__head">
        <RepoAvatar repo={repo} />
        <span className="repo-card__id">
          <span className="repo-card__name">{repo.name}</span>
          <br />
          <span className="repo-card__owner">{repo.owner}</span>
        </span>
        <span className="repo-card__arrow">
          <ArrowUpRightIcon size={17} />
        </span>
      </div>

      <p className="repo-card__desc">
        {repo.description ??
          `${repo.fullName} — see the repository on GitHub for details.`}
      </p>

      {repo.topics.length > 0 && (
        <div className="repo-card__tags">
          {repo.topics.slice(0, 4).map((topic) => (
            <span key={topic} className="tag">
              {topic}
            </span>
          ))}
        </div>
      )}

      <div className="repo-card__meta">
        <span className="repo-card__stat">
          <StarIcon size={14} />
          {formatCount(repo.stars)}
        </span>
        <span className="repo-card__stat">
          <ForkIcon size={14} />
          {formatCount(repo.forks)}
        </span>
        <span className="repo-card__updated">
          Updated {formatRelative(repo.pushedAt)}
        </span>
      </div>
    </Link>
  )
}
