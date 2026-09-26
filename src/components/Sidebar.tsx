import { useEffect, useRef, useState } from 'react'
import { categories } from '../categories'
import {
  GridIcon,
  ChipIcon,
  CodeIcon,
  GlobeIcon,
  FlaskIcon,
  BoltIcon,
  NetworkIcon,
  FrameIcon,
  WrenchIcon,
  PlugIcon,
  ClockIcon,
  ForkIcon,
  TrendIcon,
  ChevronDownIcon,
} from './Icons'

const categoryIcons: Record<string, React.ReactNode> = {
  all: <GridIcon />,
  'ai-llm-agents': <ChipIcon />,
  'coding-agents': <CodeIcon />,
  'browser-agents': <GlobeIcon />,
  'research-agents': <FlaskIcon />,
  'automation-agents': <BoltIcon />,
  'multi-agent-systems': <NetworkIcon />,
  'agent-frameworks': <FrameIcon />,
  'agent-tools': <WrenchIcon />,
  'mcp-tooling': <PlugIcon />,
}

const sortIcons: Record<string, React.ReactNode> = {
  updated: <ClockIcon />,
  forks: <ForkIcon />,
  trending: <TrendIcon />,
}

interface SidebarProps {
  activeCategory: string
  onCategoryChange: (id: string) => void
  activeSort: string
  onSortChange: (id: string) => void
  language: string
  onLanguageChange: (language: string) => void
  languages: string[]
  counts: Record<string, number>
  totalCount: number
  open: boolean
}

export function Sidebar({
  activeCategory,
  onCategoryChange,
  activeSort,
  onSortChange,
  language,
  onLanguageChange,
  languages,
  counts,
  totalCount,
  open,
}: SidebarProps) {
  const languageOptions = ['All Languages', ...languages]

  return (
    <nav className="sidebar" data-open={open} aria-label="Browse categories">
      <div className="sidebar__group">
        <ul className="category-list">
          {categories.map((category) => (
            <li key={category.id}>
              <button
                type="button"
                className="category-item"
                aria-pressed={activeCategory === category.id}
                onClick={() => onCategoryChange(category.id)}
              >
                <span className="category-item__icon">
                  {categoryIcons[category.id]}
                </span>
                <span className="category-item__label">{category.label}</span>
                <span className="category-item__count">
                  {(
                    category.id === 'all' ? totalCount : counts[category.id]
                  )?.toLocaleString() ?? '0'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="sidebar__group">
        <h2 className="sidebar__heading">Sort by</h2>
        <ul className="sort-list">
          {(
            [
              { id: 'stars', label: 'Most Stars' },
              { id: 'pushedAt', label: 'Recently Updated' },
              { id: 'forks', label: 'Most Forks' },
              { id: 'trendScore', label: 'Trending' },
            ] as const
          ).map((option) => (
            <li key={option.id}>
              <button
                type="button"
                className="sort-item"
                aria-pressed={activeSort === option.id}
                onClick={() => onSortChange(option.id)}
              >
                <span className="sort-item__radio" aria-hidden>
                  <span className="sort-item__radio-dot" />
                </span>
                <span className="sort-item__icon">{sortIcons[option.id]}</span>
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="sidebar__group">
        <h2 className="sidebar__heading" id="language-heading">
          Language
        </h2>
        <LanguageDropdown
          value={language}
          options={languageOptions}
          onChange={onLanguageChange}
        />
      </div>
    </nav>
  )
}

function LanguageDropdown({
  value,
  options,
  onChange,
}: {
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div className="language-select" ref={rootRef}>
      <button
        type="button"
        className="language-select__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby="language-heading"
        onClick={() => setOpen((o) => !o)}
      >
        {value}
        <ChevronDownIcon size={15} />
      </button>
      {open && (
        <ul className="language-select__menu" role="listbox">
          {options.map((option) => (
            <li key={option}>
              <button
                type="button"
                role="option"
                aria-selected={option === value}
                className="language-select__option"
                onClick={() => {
                  onChange(option)
                  setOpen(false)
                }}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
