// Server-only GitHub REST client used by sync actions.
// Never import this file from browser code.

const API_BASE = 'https://api.github.com'

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  html_url: string
  description: string | null
  owner: { login: string }
  stargazers_count: number
  forks_count: number
  open_issues_count: number
  watchers_count: number
  language: string | null
  topics?: string[]
  license: { spdx_id?: string | null; name?: string } | null
  created_at: string
  updated_at: string
  pushed_at: string
  archived: boolean
}

export class RateLimitError extends Error {
  resetAt: number
  constructor(resetAt: number) {
    super('GitHub rate limit exhausted')
    this.resetAt = resetAt
  }
}

function authHeaders(token: string | undefined): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

async function request<T>(
  path: string,
  token: string | undefined,
): Promise<T | null> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: authHeaders(token),
  })

  if (response.status === 404) return null

  if (response.status === 403 || response.status === 429) {
    const remaining = response.headers.get('x-ratelimit-remaining')
    if (remaining === '0') {
      const resetHeader = response.headers.get('x-ratelimit-reset')
      throw new RateLimitError(
        resetHeader ? Number(resetHeader) * 1000 : Date.now() + 60_000,
      )
    }
    throw new Error(`GitHub API ${response.status} for ${path}`)
  }

  if (!response.ok) {
    throw new Error(`GitHub API ${response.status} for ${path}`)
  }

  return (await response.json()) as T
}

export async function searchRepositories(
  query: string,
  token: string | undefined,
  perPage = 30,
): Promise<GitHubRepo[]> {
  const params = new URLSearchParams({
    q: query,
    per_page: String(perPage),
    sort: 'stars',
    order: 'desc',
  })
  const result = await request<{ items: GitHubRepo[] }>(
    `/search/repositories?${params.toString()}`,
    token,
  )
  return result?.items ?? []
}

export async function getReadme(
  owner: string,
  name: string,
  token: string | undefined,
): Promise<string | null> {
  const result = await request<{ content: string; encoding: string }>(
    `/repos/${owner}/${name}/readme`,
    token,
  )
  if (!result || result.encoding !== 'base64') return null
  try {
    const decoded = atob(result.content.replace(/\n/g, ''))
    // ~8KB is plenty for summarisation; keeps memory bounded.
    return decoded.slice(0, 8192)
  } catch {
    return null
  }
}
