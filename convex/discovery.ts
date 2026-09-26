// Discovery seeds (AGENTS.md section 7). Each run searches these queries;
// GitHub search limits mean we accept one page per query per run and let
// the hourly cron cover the ground incrementally.
export const DISCOVERY_QUERIES: Array<{ query: string; category: CategoryHint }> =
  [
    { query: 'llm agent stars:>100', category: 'ai-llm-agents' },
    { query: 'ai agent framework stars:>100', category: 'agent-frameworks' },
    { query: 'autonomous agent stars:>100', category: 'ai-llm-agents' },
    { query: 'coding agent stars:>50', category: 'coding-agents' },
    { query: 'software engineering agent stars:>20', category: 'coding-agents' },
    { query: 'browser agent stars:>50', category: 'browser-agents' },
    { query: 'web agent llm stars:>50', category: 'browser-agents' },
    { query: 'browser automation ai stars:>50', category: 'browser-agents' },
    { query: 'research agent llm stars:>20', category: 'research-agents' },
    { query: 'deep research agent stars:>20', category: 'research-agents' },
    { query: 'automation agent llm stars:>50', category: 'automation-agents' },
    { query: 'task agent llm stars:>20', category: 'automation-agents' },
    { query: 'multi-agent framework stars:>100', category: 'multi-agent-systems' },
    { query: 'agent orchestration stars:>50', category: 'multi-agent-systems' },
    { query: 'agent memory stars:>50', category: 'agent-tools' },
    { query: 'tool calling llm stars:>50', category: 'agent-tools' },
    { query: 'agent evaluation stars:>20', category: 'agent-tools' },
    { query: 'mcp server stars:>50', category: 'mcp-tooling' },
    { query: 'model context protocol stars:>20', category: 'mcp-tooling' },
  ]

export type CategoryHint =
  | 'ai-llm-agents'
  | 'coding-agents'
  | 'browser-agents'
  | 'research-agents'
  | 'automation-agents'
  | 'multi-agent-systems'
  | 'agent-frameworks'
  | 'agent-tools'
  | 'mcp-tooling'
