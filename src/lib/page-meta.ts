import { getCopy } from '@/copy'

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  const el =
    document.querySelector(`meta[${attr}="${key}"]`) ??
    (() => {
      const m = document.createElement('meta')
      m.setAttribute(attr, key)
      document.head.appendChild(m)
      return m
    })()
  el.setAttribute('content', content)
}

function setCanonical(href: string) {
  let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'canonical'
    document.head.appendChild(link)
  }
  link.href = href
}

/** Meta klien — crawler chat tetap lihat HTML awal sampai Worker OG (backlog). */
export function applyHomeMeta(origin: string = window.location.origin) {
  document.title = getCopy().meta.homeTitle
  setMeta('name', 'description', getCopy().meta.homeDescription)
  setMeta('property', 'og:title', getCopy().meta.homeTitle)
  setMeta('property', 'og:description', getCopy().meta.homeDescription)
  setMeta('property', 'og:url', `${origin}/`)
  setCanonical(`${origin}/`)
}

export function applyWilayahMeta(
  name: string,
  path: string,
  origin: string = window.location.origin,
) {
  const title = getCopy().meta.wilayahTitle(name)
  const description = getCopy().meta.wilayahDescription(name)
  const url = `${origin}${path}`
  document.title = title
  setMeta('name', 'description', description)
  setMeta('property', 'og:title', title)
  setMeta('property', 'og:description', description)
  setMeta('property', 'og:url', url)
  setCanonical(url)
}
