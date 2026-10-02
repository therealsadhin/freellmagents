import { LogoMark, SearchIcon } from './Icons'

interface TopBarProps {
  search: string
  onSearchChange: (value: string) => void
  searchRef: React.RefObject<HTMLInputElement | null>
}

export function TopBar({ search, onSearchChange, searchRef }: TopBarProps) {
  return (
    <header className="topbar">
      <a className="topbar__brand" href="/" aria-label="freellmagents.com home">
        <LogoMark />
        <span>freellmagents.com</span>
      </a>

      <div className="topbar__search">
        <span className="topbar__search-icon">
          <SearchIcon size={17} />
        </span>
        <input
          ref={searchRef}
          type="search"
          placeholder="Search repositories, topics, or keywords..."
          aria-label="Search repositories, topics, or keywords"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
        <span className="topbar__kbd" aria-hidden>
          <kbd>Ctrl</kbd>
          <kbd>K</kbd>
        </span>
      </div>
    </header>
  )
}
