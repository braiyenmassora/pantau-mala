import { describe, expect, it } from 'vitest'

import {
  injectOgHtml,
  isSocialCrawler,
  labelFromWilayahSlug,
  ogPayloadForPath,
  parseWilayahSharePath,
} from './og-html.mjs'

const shell = `<!doctype html><html><head>
<title>Old</title>
<meta name="description" content="old" />
<meta property="og:title" content="old" />
<meta property="og:description" content="old" />
<meta property="og:url" content="https://example.test/" />
<meta property="og:image" content="https://example.test/og.png?v=2" />
<link rel="canonical" href="https://example.test/" />
</head><body></body></html>`

describe('og-html', () => {
  it('detects common share crawlers', () => {
    expect(isSocialCrawler('WhatsApp/2.0')).toBe(true)
    expect(isSocialCrawler('facebookexternalhit/1.1')).toBe(true)
    expect(isSocialCrawler('Mozilla/5.0 (Windows NT 10.0)')).toBe(false)
  })

  it('parses wilayah share paths and labels', () => {
    expect(parseWilayahSharePath('/wilayah/kab-pulang-pisau-6211')).toEqual({
      kind: 'wilayah',
      slug: 'kab-pulang-pisau',
      pathCode: '6211',
    })
    expect(labelFromWilayahSlug('kab-pulang-pisau')).toBe('Kab. Pulang Pisau')
  })

  it('builds wilayah OG payload with absolute image', () => {
    const og = ogPayloadForPath('/wilayah/kapuas-6203', 'https://pantaumala.live')
    expect(og.title).toContain('Kapuas')
    expect(og.title).toContain('Pantau Mala')
    expect(og.url).toBe('https://pantaumala.live/wilayah/kapuas-6203')
    expect(og.image).toBe('https://pantaumala.live/og.png?v=2')
    expect(og.description).toContain('Bukan peringatan resmi kebakaran')
  })

  it('injects title and og tags into HTML', () => {
    const html = injectOgHtml(shell, {
      title: 'Kab. Tes - Pantau Mala',
      description: 'Deskripsi uji.',
      url: 'https://pantaumala.live/wilayah/kab-tes-6299',
      image: 'https://pantaumala.live/og.png?v=2',
      imageAlt: 'alt',
    })
    expect(html).toContain('<title>Kab. Tes - Pantau Mala</title>')
    expect(html).toContain('content="Kab. Tes - Pantau Mala"')
    expect(html).toContain('content="https://pantaumala.live/wilayah/kab-tes-6299"')
    expect(html).toContain('og:image:alt')
  })
})
