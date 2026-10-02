// Relevance + category classification (AGENTS.md sections 7-9).
// Evidence-based: name, description and topics must indicate an actual
// AI/LLM agent relationship, not just the word "AI" anywhere.

import type { GitHubRepo } from './github'

export const CATEGORY_IDS = [
  'ai-llm-agents',
  'coding-agents',
  'browser-agents',
  'research-agents',
  'automation-agents',
  'multi-agent-systems',
  'agent-frameworks',
  'agent-tools',
  'mcp-tooling',
  'skills',
  'ai-models',
] as const

export type CategoryId = (typeof CATEGORY_IDS)[number]

export const OPEN_SOURCE_LICENSES = new Set([
  'MIT',
  'Apache-2.0',
  'GPL-2.0',
  'GPL-3.0',
  'LGPL-2.1',
  'LGPL-3.0',
  'AGPL-3.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'MPL-2.0',
  'ISC',
  'Unlicense',
  'CC0-1.0',
  'EPL-2.0',
  'EUPL-1.2',
  'Artistic-2.0',
])

interface CategoryRule {
  id: CategoryId
  keywords: string[]
}

const CATEGORY_RULES: CategoryRule[] = [
  {
    id: 'coding-agents',
    keywords: [
      'coding agent',
      'code agent',
      'software engineering agent',
      'swe agent',
      'ai developer',
      'code generation agent',
      'autopilot code',
      'pair programmer',
      'ai programmer',
    ],
  },
  {
    id: 'browser-agents',
    keywords: [
      'browser agent',
      'browser use',
      'web agent',
      'browser automation ai',
      'ai browser',
      'computer use',
      'web automation agent',
      'playwright agent',
    ],
  },
  {
    id: 'research-agents',
    keywords: [
      'research agent',
      'deep research',
      'web research',
      'paper agent',
      'literature review',
      'research assistant ai',
    ],
  },
  {
    id: 'automation-agents',
    keywords: [
      'automation agent',
      'workflow agent',
      'task agent',
      'autonomous task',
      'ai automation',
      'agent workflow',
    ],
  },
  {
    id: 'multi-agent-systems',
    keywords: [
      'multi-agent',
      'multi agent',
      'agent orchestration',
      'agent swarm',
      'agent society',
      'agents collaboration',
      'crew of agents',
    ],
  },
  {
    id: 'agent-frameworks',
    keywords: [
      'agent framework',
      'agents framework',
      'build agents',
      'agent sdk',
      'framework for agents',
      'autonomous agent framework',
    ],
  },
  {
    id: 'agent-tools',
    keywords: [
      'agent memory',
      'agent tools',
      'tool calling',
      'function calling',
      'tool use',
      'agent evaluation',
      'agent evals',
      'agent observability',
      'agent tracing',
    ],
  },
  {
    id: 'mcp-tooling',
    keywords: [
      'mcp',
      'model context protocol',
      'mcp server',
      'mcp client',
    ],
  },
  {
    id: 'skills',
    keywords: [
      'agent skills',
      'agent skill',
      'claude skills',
      'claude skill',
      'skill library',
      'skills for agents',
      'skills for ai',
      'agent abilities',
      'skills',
      'skill set',
    ],
  },
  {
    id: 'ai-models',
    keywords: [
      'ai model',
      'ai models',
      'llm model',
      'language model',
      'foundation model',
      'open weights',
      'open-source model',
      'model zoo',
      'inference engine',
      'large language model',
      'vllm',
      'ollama',
      'llama.cpp',
      'gguf',
      'fine-tuning',
      'fine tuning',
      'quantization',
      'quantization',
      'embedding model',
      'speech model',
      'diffusion model',
      'inference framework',
      'local llm',
      'run llm',
    ],
  },
  {
    id: 'ai-llm-agents',
    keywords: [
      'llm agent',
      'ai agent',
      'autonomous agent',
      'llm agents',
      'ai agents',
      'intelligent agent',
      'agent ai',
    ],
  },
]

// Generic "agent" alone is too weak; require a qualifying signal.
const STRONG_AGENT_TERMS = [
  'llm agent',
  'ai agent',
  'ai agents',
  'llm agents',
  'autonomous agent',
  'agent framework',
  'agents framework',
  'multi-agent',
  'multi agent',
  'coding agent',
  'browser agent',
  'research agent',
  'mcp',
  'model context protocol',
  'tool calling',
  'function calling',
  'agent skills',
  'language model',
  'open weights',
]

const NEGATIVE_TERMS = [
  'game',
  'minecraft',
  'mod',
  'telegram bot',
  'discord bot',
  'crypto',
  'nft',
  'trading bot',
  'scanner',
  'malware',
  'cheat',
]

function haystack(repo: GitHubRepo): string {
  return [
    repo.name,
    repo.description ?? '',
    (repo.topics ?? []).join(' '),
  ]
    .join(' ')
    .toLowerCase()
}

export function classify(repo: GitHubRepo): {
  isRelevant: boolean
  categories: CategoryId[]
} {
  const text = haystack(repo)

  if (NEGATIVE_TERMS.some((term) => text.includes(term))) {
    return { isRelevant: false, categories: [] }
  }

  const categories = CATEGORY_RULES.filter((rule) =>
    rule.keywords.some((keyword) => text.includes(keyword)),
  ).map((rule) => rule.id)

  const strongMatch = STRONG_AGENT_TERMS.some((term) => text.includes(term))
  const topicMatch = (repo.topics ?? []).some((topic) =>
    ['agent', 'agents', 'llm', 'mcp', 'autogpt', 'ai-agents', 'llm-agent'].includes(
      topic.toLowerCase(),
    ),
  )

  const isRelevant =
    categories.length > 0 || (strongMatch && topicMatch) || topicMatch

  return {
    isRelevant,
    // Deduplicate while keeping rule priority order.
    categories: [...new Set(categories)],
  }
}

export function isOpenSource(repo: GitHubRepo): boolean {
  const spdx = repo.license?.spdx_id
  return !!spdx && spdx !== 'NOASSERTION' && spdx !== 'OTHER' &&
    OPEN_SOURCE_LICENSES.has(spdx)
}

// Deterministic, documented trend score (AGENTS.md section 10):
// engagement normalised by inactivity, using only stored GitHub data.
//   trendScore = (stars + 2 * forks) / (1 + days since last push)
export function trendScore(repo: GitHubRepo, now: number): number {
  const daysSincePush = Math.max(
    0,
    (now - new Date(repo.pushed_at).getTime()) / 86_400_000,
  )
  return (repo.stargazers_count + 2 * repo.forks_count) / (1 + daysSincePush)
}
