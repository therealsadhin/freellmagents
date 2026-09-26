import { useEffect } from 'react'

const SITE_NAME = 'FreeLLMAgents'
const SITE_ORIGIN = 'https://freellmagents.com'
const DEFAULT_TITLE = 'Free AI Agents & Open Source AI Tools | FreeLLMAgents'
const DEFAULT_DESCRIPTION =
  'Discover, search and explore the best free and open-source AI and LLM agent repositories on GitHub — all in one place.'
const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/og-image.png`

export const SITE_DEFAULTS = {
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  ogImage: DEFAULT_OG_IMAGE,
}

function upsertMeta(attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(
    `meta[${attribute}="${key}"]`,
  )
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

function upsertCanonical(href: string | null) {
  let link = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  )
  if (!href) {
    link?.remove()
    return
  }
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  link.setAttribute('href', href)
}

function upsertJsonLd(data: object | object[] | undefined) {
  const existing = document.head.querySelectorAll('script[data-seo-jsonld]')
  existing.forEach((node) => node.remove())
  if (!data) return
  const script = document.createElement('script')
  script.type = 'application/ld+json'
  script.setAttribute('data-seo-jsonld', '')
  script.textContent = JSON.stringify(data)
  document.head.appendChild(script)
}

/**
 * Sets per-page <title>, meta description, canonical URL, Open Graph,
 * Twitter card metadata and JSON-LD structured data so repository detail
 * pages carry repository-specific metadata (AGENTS.md section 37).
 */
export function useSeo(options: {
  title: string
  description: string
  canonicalPath?: string
  /** Absolute or root-relative URL of the social sharing image. */
  image?: string
  /** Set on not-found/thin pages so search engines drop them. */
  noindex?: boolean
  /** JSON-LD structured data accurately describing this page. */
  jsonLd?: object | object[]
}) {
  const { title, description, canonicalPath, image, noindex, jsonLd } = options

  useEffect(() => {
    const canonicalUrl = canonicalPath
      ? `${SITE_ORIGIN}${canonicalPath}`
      : `${SITE_ORIGIN}/`
    const imageUrl = image
      ? image.startsWith('http')
        ? image
        : `${SITE_ORIGIN}${image}`
      : DEFAULT_OG_IMAGE

    document.title = title
    upsertMeta('name', 'description', description)
    upsertCanonical(canonicalUrl)
    upsertMeta(
      'name',
      'robots',
      noindex ? 'noindex, follow' : 'index, follow',
    )

    upsertMeta('property', 'og:title', title)
    upsertMeta('property', 'og:description', description)
    upsertMeta('property', 'og:url', canonicalUrl)
    upsertMeta('property', 'og:type', canonicalPath ? 'article' : 'website')
    upsertMeta('property', 'og:site_name', SITE_NAME)
    upsertMeta('property', 'og:image', imageUrl)

    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', title)
    upsertMeta('name', 'twitter:description', description)
    upsertMeta('name', 'twitter:image', imageUrl)

    upsertJsonLd(jsonLd)

    return () => {
      // Restore site defaults when leaving the page.
      document.title = DEFAULT_TITLE
      upsertMeta('name', 'description', DEFAULT_DESCRIPTION)
      upsertCanonical(null)
      upsertMeta('name', 'robots', 'index, follow')
      upsertMeta('property', 'og:title', DEFAULT_TITLE)
      upsertMeta('property', 'og:description', DEFAULT_DESCRIPTION)
      upsertMeta('property', 'og:url', `${SITE_ORIGIN}/`)
      upsertMeta('property', 'og:type', 'website')
      upsertMeta('property', 'og:image', DEFAULT_OG_IMAGE)
      upsertMeta('name', 'twitter:title', DEFAULT_TITLE)
      upsertMeta('name', 'twitter:description', DEFAULT_DESCRIPTION)
      upsertMeta('name', 'twitter:image', DEFAULT_OG_IMAGE)
      upsertJsonLd(undefined)
    }
  }, [title, description, canonicalPath, image, noindex, jsonLd])
}

export { SITE_NAME, SITE_ORIGIN }
