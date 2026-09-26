// Static UI taxonomy (labels/icons) — counts come live from Convex.
export interface Category {
  id: string
  label: string
}

export const categories: Category[] = [
  { id: 'all', label: 'All Repositories' },
  { id: 'ai-llm-agents', label: 'AI / LLM Agents' },
  { id: 'coding-agents', label: 'Coding Agents' },
  { id: 'browser-agents', label: 'Browser Agents' },
  { id: 'research-agents', label: 'Research Agents' },
  { id: 'automation-agents', label: 'Automation Agents' },
  { id: 'multi-agent-systems', label: 'Multi-Agent Systems' },
  { id: 'agent-frameworks', label: 'Agent Frameworks' },
  { id: 'agent-tools', label: 'Agent Tools' },
  { id: 'mcp-tooling', label: 'MCP / Tooling' },
]

export const tabs = ['All', 'Popular', 'New', 'Trending'] as const

// Tab -> Convex sort id
export const tabSorts: Record<string, string> = {
  All: 'stars',
  Popular: 'stars',
  New: 'firstSeenAt',
  Trending: 'trendScore',
}
