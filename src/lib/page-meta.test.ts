/** @vitest-environment jsdom */
import { afterEach, describe, expect, it } from 'vitest'

import { copy } from '@/copy/id'
import { applyHomeMeta, applyWilayahMeta } from '@/lib/page-meta'

describe('page-meta', () => {
  afterEach(() => {
    applyHomeMeta('https://pantaumala.live')
  })

  it('sets wilayah title and restores home defaults', () => {
    applyWilayahMeta(
      'Kab. Pulang Pisau',
      '/wilayah/kab-pulang-pisau-6211',
      'https://pantaumala.live',
    )
    expect(document.title).toBe(copy.meta.wilayahTitle('Kab. Pulang Pisau'))
    expect(
      document.querySelector('meta[name="description"]')?.getAttribute('content'),
    ).toBe(copy.meta.wilayahDescription('Kab. Pulang Pisau'))

    applyHomeMeta('https://pantaumala.live')
    expect(document.title).toBe(copy.meta.homeTitle)
  })
})
