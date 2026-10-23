import { getCopy, getLocale } from '@/copy'

const SITE_NAME = 'Pantau Mala'
const OG_IMAGE_PATH = '/og.png'
const OG_IMAGE_WIDTH = '1200'
const OG_IMAGE_HEIGHT = '630'

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

function ogImageUrl(origin: string) {
  return `${origin.replace(/\/$/, '')}${OG_IMAGE_PATH}`
}

/** Meta + Open Graph + Twitter — selaras locale; crawler share utama lewat Worker. */
function applyShareMeta(opts: {
  title: string
  description: string
  url: string
  origin: string
}) {
  const { title, description, url, origin } = opts
  const image = ogImageUrl(origin)
  const imageAlt = getCopy().meta.ogImageAlt
  const locale = getLocale() === 'en' ? 'en_US' : 'id_ID'
  const alternate = locale === 'id_ID' ? 'en_US' : 'id_ID'

  document.title = title
  setMeta('name', 'description', description)
  setCanonical(url)

  setMeta('property', 'og:type', 'website')
  setMeta('property', 'og:site_name', SITE_NAME)
  setMeta('property', 'og:title', title)
  setMeta('property', 'og:description', description)
  setMeta('property', 'og:url', url)
  setMeta('property', 'og:locale', locale)
  setMeta('property', 'og:locale:alternate', alternate)
  setMeta('property', 'og:image', image)
  setMeta('property', 'og:image:width', OG_IMAGE_WIDTH)
  setMeta('property', 'og:image:height', OG_IMAGE_HEIGHT)
  setMeta('property', 'og:image:alt', imageAlt)

  setMeta('name', 'twitter:card', 'summary_large_image')
  setMeta('name', 'twitter:title', title)
  setMeta('name', 'twitter:description', description)
  setMeta('name', 'twitter:image', image)
}

export function applyHomeMeta(origin: string = window.location.origin) {
  applyShareMeta({
    title: getCopy().meta.homeTitle,
    description: getCopy().meta.homeDescription,
    url: `${origin.replace(/\/$/, '')}/`,
    origin,
  })
}

export function applyWilayahMeta(
  name: string,
  path: string,
  origin: string = window.location.origin,
) {
  applyShareMeta({
    title: getCopy().meta.wilayahTitle(name),
    description: getCopy().meta.wilayahDescription(name),
    url: `${origin.replace(/\/$/, '')}${path}`,
    origin,
  })
}
