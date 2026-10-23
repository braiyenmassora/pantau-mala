/** Open Graph untuk crawler share (WhatsApp, Telegram, Slack, dll.). */

export const OG_SITE_NAME = 'Pantau Mala'
// ?v= bust WhatsApp/FB image cache after regenerating public/og.png.
export const OG_IMAGE_PATH = '/og.png?v=3'
export const OG_IMAGE_WIDTH = '1200'
export const OG_IMAGE_HEIGHT = '630'

/** Copy ID baku — selaras src/copy/id.ts meta (+ istilah-baku). */
export const OG_HOME = {
  title: 'Pantau Mala - Pantauan titik panas',
  description:
    'Pantau Mala (pantaumala). Peta titik panas satelit per kabupaten/kota di Indonesia. Bukan peringatan resmi kebakaran.',
  imageAlt: 'Pantau Mala · pantauan titik panas satelit Indonesia',
}

export function wilayahOg(name) {
  return {
    title: `${name} - Pantau Mala`,
    description: `Pantau Mala. Pantauan titik panas satelit di ${name}. Bukan peringatan resmi kebakaran.`,
    imageAlt: OG_HOME.imageAlt,
  }
}

/** UA crawler pratinjau tautan — bukan browser pengguna. */
export function isSocialCrawler(userAgent) {
  if (!userAgent) return false
  return /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|TelegramBot|SkypeUriPreview|Applebot|Googlebot|bingbot|DuckDuckBot|Baiduspider|YandexBot|embedly|Quora Link Preview|Pinterest|vkShare|W3C_Validator|redditbot|Viber|Line\//i.test(
    userAgent,
  )
}

/** Slug URL → label singkat untuk judul OG (bukan nama resmi BPS). */
export function labelFromWilayahSlug(slug) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => {
      if (w === 'kab') return 'Kab.'
      if (w === 'kota') return 'Kota'
      if (w === 'kabupaten') return 'Kabupaten'
      return w.charAt(0).toUpperCase() + w.slice(1)
    })
    .join(' ')
}

export function parseWilayahSharePath(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (path === '/') return { kind: 'home' }
  const m = /^\/wilayah\/(.+)-(\d{4})$/.exec(path)
  if (!m) {
    if (path.startsWith('/wilayah')) return { kind: 'invalid' }
    return { kind: 'other' }
  }
  return { kind: 'wilayah', slug: m[1], pathCode: m[2] }
}

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function setMetaContent(html, attr, key, content) {
  const safe = escapeAttr(content)
  const re = new RegExp(
    `(<meta\\s+[^>]*${attr}=["']${key}["'][^>]*\\scontent=["'])([^"']*)(["'][^>]*>)`,
    'i',
  )
  if (re.test(html)) return html.replace(re, `$1${safe}$3`)
  const reFlip = new RegExp(
    `(<meta\\s+[^>]*content=["'])([^"']*)(["'][^>]*\\s${attr}=["']${key}["'][^>]*>)`,
    'i',
  )
  if (reFlip.test(html)) return html.replace(reFlip, `$1${safe}$3`)
  return html.replace(
    /<\/head>/i,
    `    <meta ${attr}="${key}" content="${safe}" />\n  </head>`,
  )
}

function setTitle(html, title) {
  const safe = escapeAttr(title)
  if (/<title>[\s\S]*?<\/title>/i.test(html)) {
    return html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${safe}</title>`)
  }
  return html.replace(/<\/head>/i, `    <title>${safe}</title>\n  </head>`)
}

function setCanonical(html, href) {
  const safe = escapeAttr(href)
  if (/<link[^>]*rel=["']canonical["'][^>]*>/i.test(html)) {
    return html.replace(
      /<link([^>]*rel=["']canonical["'][^>]*)>/i,
      (_m, attrs) => {
        if (/\bhref=/.test(attrs)) {
          return `<link${attrs.replace(/\bhref=["'][^"']*["']/, `href="${safe}"`)}>`
        }
        return `<link${attrs} href="${safe}">`
      },
    )
  }
  return html.replace(
    /<\/head>/i,
    `    <link rel="canonical" href="${safe}" />\n  </head>`,
  )
}

/**
 * Sisipkan / perbarui meta OG+Twitter di HTML index agar crawler share
 * mendapat judul/URL halaman (bukan hanya home SPA).
 */
export function injectOgHtml(html, { title, description, url, image, imageAlt }) {
  let out = html
  out = setTitle(out, title)
  out = setCanonical(out, url)
  out = setMetaContent(out, 'name', 'description', description)
  out = setMetaContent(out, 'property', 'og:title', title)
  out = setMetaContent(out, 'property', 'og:description', description)
  out = setMetaContent(out, 'property', 'og:url', url)
  out = setMetaContent(out, 'property', 'og:image', image)
  out = setMetaContent(out, 'property', 'og:image:alt', imageAlt)
  out = setMetaContent(out, 'property', 'og:type', 'website')
  out = setMetaContent(out, 'property', 'og:site_name', OG_SITE_NAME)
  out = setMetaContent(out, 'property', 'og:locale', 'id_ID')
  out = setMetaContent(out, 'name', 'twitter:card', 'summary_large_image')
  out = setMetaContent(out, 'name', 'twitter:title', title)
  out = setMetaContent(out, 'name', 'twitter:description', description)
  out = setMetaContent(out, 'name', 'twitter:image', image)
  return out
}

export function ogPayloadForPath(pathname, origin) {
  const base = origin.replace(/\/$/, '')
  const image = `${base}${OG_IMAGE_PATH}`
  const parsed = parseWilayahSharePath(pathname)
  if (parsed.kind === 'wilayah') {
    const name = labelFromWilayahSlug(parsed.slug)
    const copy = wilayahOg(name)
    return {
      ...copy,
      url: `${base}/wilayah/${parsed.slug}-${parsed.pathCode}`,
      image,
    }
  }
  return {
    ...OG_HOME,
    url: `${base}/`,
    image,
  }
}
