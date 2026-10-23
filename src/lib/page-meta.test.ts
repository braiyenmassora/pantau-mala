/** @vitest-environment jsdom */
import { afterEach, describe, expect, it } from 'vitest'

import { copy } from '@/copy/id'
import { applyHomeMeta, applyWilayahMeta } from '@/lib/page-meta'

describe('page-meta', () => {
  afterEach(() => {
    applyHomeMeta('https://pantaumala.live')
  })

  it('sets wilayah title, OG, and restores home defaults', () => {
    applyWilayahMeta(
      'Kab. Pulang Pisau',
      '/wilayah/kab-pulang-pisau-6211',
      'https://pantaumala.live',
    )
    expect(document.title).toBe(copy.meta.wilayahTitle('Kab. Pulang Pisau'))
    expect(
      document.querySelector('meta[name="description"]')?.getAttribute('content'),
    ).toBe(copy.meta.wilayahDescription('Kab. Pulang Pisau'))
    expect(
      document.querySelector('meta[property="og:title"]')?.getAttribute('content'),
    ).toBe(copy.meta.wilayahTitle('Kab. Pulang Pisau'))
    expect(
      document.querySelector('meta[property="og:url"]')?.getAttribute('content'),
    ).toBe('https://pantaumala.live/wilayah/kab-pulang-pisau-6211')
    expect(
      document.querySelector('meta[property="og:image"]')?.getAttribute('content'),
    ).toBe('https://pantaumala.live/og.png?v=2')
    expect(
      document.querySelector('meta[name="twitter:card"]')?.getAttribute('content'),
    ).toBe('summary_large_image')

    applyHomeMeta('https://pantaumala.live')
    expect(document.title).toBe(copy.meta.homeTitle)
    expect(copy.meta.homeDescription.toLowerCase()).toContain('pantau mala')
    expect(
      document.querySelector('meta[property="og:url"]')?.getAttribute('content'),
    ).toBe('https://pantaumala.live/')
  })
})
