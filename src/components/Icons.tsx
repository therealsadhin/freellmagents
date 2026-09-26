interface IconProps {
  size?: number
}

function base(size?: number) {
  return {
    width: size ?? 16,
    height: size ?? 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }
}

export function LogoMark({ size = 26 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 1.5c.7 4.9 4 8.6 10.5 10.5C16 13.9 12.7 17.6 12 22.5 11.3 17.6 8 13.9 1.5 12 8 10.1 11.3 6.4 12 1.5Z" />
      <circle cx="19.5" cy="4" r="1.4" />
    </svg>
  )
}

export function SearchIcon({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

export function SunIcon({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  )
}

export function DotsIcon({ size }: IconProps) {
  return (
    <svg {...base(size)} fill="currentColor" stroke="none">
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
    </svg>
  )
}

export function MenuIcon({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

export function ArrowUpRightIcon({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  )
}

export function StarIcon({ size }: IconProps) {
  return (
    <svg {...base(size)} fill="currentColor" stroke="none">
      <path d="m12 3 2.7 5.9 6.3.7-4.7 4.3 1.3 6.1L12 16.9 6.4 20l1.3-6.1L3 9.6l6.3-.7L12 3Z" />
    </svg>
  )
}

export function ForkIcon({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="6" cy="5" r="2.2" />
      <circle cx="18" cy="5" r="2.2" />
      <circle cx="12" cy="19" r="2.2" />
      <path d="M6 7.5v2a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3v-2M12 12.5v4" />
    </svg>
  )
}

export function FilterIcon({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  )
}

export function ChevronDownIcon({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

/* Sidebar category icons */
export function GridIcon({ size }: IconProps) {
  return (
    <svg {...base(size)} fill="currentColor" stroke="none">
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
    </svg>
  )
}

export function ChipIcon({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="7" y="7" width="10" height="10" rx="2" />
      <path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2m0-14-2 2M7 17l-2 2" />
    </svg>
  )
}

export function MobileIcon({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="8" y="3" width="8" height="18" rx="2" />
      <path d="M11 18h2" />
    </svg>
  )
}

export function ServerIcon({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="3" y="4" width="18" height="7" rx="2" />
      <rect x="3" y="13" width="18" height="7" rx="2" />
      <path d="M7 7.5h.01M7 16.5h.01" />
    </svg>
  )
}

export function GamepadIcon({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M6 9h12a4 4 0 0 1 4 4v2a3 3 0 0 1-5.5 1.7L15 15H9l-1.5 1.7A3 3 0 0 1 2 15v-2a4 4 0 0 1 4-4Z" />
      <path d="M8 12h2M7 13v-2M15.5 11.5h.01M17.5 13h.01" />
    </svg>
  )
}

export function ChartIcon({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4 20V10m6 10V4m6 16v-7m-13 7h16" />
    </svg>
  )
}

export function CubeIcon({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M12 2 21 7v10l-9 5-9-5V7l9-5Z" />
      <path d="M12 12 21 7M12 12v10M12 12 3 7" />
    </svg>
  )
}

export function PaletteIcon({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="m3 16 5-5 4 4 4-4 5 5" />
      <circle cx="8.5" cy="7.5" r="1" />
    </svg>
  )
}

export function BoxIcon({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M9 9h6v6H9z" />
    </svg>
  )
}

export function ClockIcon({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  )
}

export function TrendIcon({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="m3 17 6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </svg>
  )
}

export function CodeIcon({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="m8 8-4 4 4 4M16 8l4 4-4 4M13 5l-2 14" />
    </svg>
  )
}

export function GlobeIcon({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3Z" />
    </svg>
  )
}

export function FlaskIcon({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M10 3v6L4.5 18.5A2 2 0 0 0 6.2 21.5h11.6a2 2 0 0 0 1.7-3L14 9V3" />
      <path d="M8.5 3h7M7 15h10" />
    </svg>
  )
}

export function BoltIcon({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
    </svg>
  )
}

export function NetworkIcon({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="12" cy="5" r="2.5" />
      <circle cx="5" cy="19" r="2.5" />
      <circle cx="19" cy="19" r="2.5" />
      <path d="M12 7.5v4m0 0-5.5 5m5.5-5 5.5 5" />
    </svg>
  )
}

export function FrameIcon({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M4 10h16M10 10v10" />
    </svg>
  )
}

export function WrenchIcon({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M14.5 6.5a4.5 4.5 0 0 0-6 5.7L3 17.7 6.3 21l5.5-5.5a4.5 4.5 0 0 0 5.7-6L14 13l-3-3 3.5-3.5Z" />
    </svg>
  )
}

export function PlugIcon({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M9 3v5m6-5v5M6 8h12v3a6 6 0 0 1-6 6 6 6 0 0 1-6-6V8Zm6 12v3" />
    </svg>
  )
}
