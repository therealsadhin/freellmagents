// Deterministic README summarisation. Extracts concise, grounded content —
// never invents features (AGENTS.md sections 14, 25 spec).

const MAX_OVERVIEW_CHARS = 320
const MAX_FEATURES = 6

function stripMarkdown(line: string): string {
  return line
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#*_`>|]/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function isNoise(line: string): boolean {
  const lower = line.toLowerCase()
  return (
    !line ||
    lower.startsWith('http') ||
    lower.startsWith('<') ||
    /^\|/.test(line) ||
    /^[-=]{3,}$/.test(line.trim()) ||
    lower.includes('license') && line.length < 60 ||
    lower.startsWith('badges') ||
    lower.includes('shield.io') ||
    /^\p{Emoji}/u.test(line)
  )
}

export function summariseReadme(
  readme: string,
): { overview: string; features: string[] } {
  const lines = readme.split('\n').map((line) => line.trim())

  // Overview: first meaningful paragraph after the top heading.
  const overviewParts: string[] = []
  for (const line of lines) {
    if (line.startsWith('#')) continue
    if (/^[-*+]\s|^\d+\.\s/.test(line)) break
    if (isNoise(line)) continue
    overviewParts.push(stripMarkdown(line))
    if (overviewParts.join(' ').length >= MAX_OVERVIEW_CHARS) break
  }
  let overview = overviewParts.join(' ').slice(0, MAX_OVERVIEW_CHARS)
  if (overview.length === MAX_OVERVIEW_CHARS) {
    overview = overview.slice(0, overview.lastIndexOf(' ')) + '…'
  }

  // Features: bullet points from the whole document, deduplicated.
  const features: string[] = []
  const seen = new Set<string>()
  for (const line of lines) {
    const match = line.match(/^[-*+]\s+(.{10,160})$/)
    if (!match) continue
    const text = stripMarkdown(match[1])
    if (
      !text ||
      text.length < 12 ||
      seen.has(text.toLowerCase()) ||
      /http|install|contribut|copyright|license|badge/i.test(text)
    ) {
      continue
    }
    seen.add(text.toLowerCase())
    features.push(text)
    if (features.length >= MAX_FEATURES) break
  }

  return { overview: overview || '', features }
}
