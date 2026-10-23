import { describe, expect, it } from 'vitest'

import { basemapPlaceTextField } from '@/lib/basemap-labels'

describe('basemapPlaceTextField', () => {
  it('prefers Indonesian names for id locale and English for en', () => {
    expect(basemapPlaceTextField('id')).toEqual([
      'coalesce',
      ['get', 'name:id'],
      ['get', 'name'],
      ['get', 'name:en'],
    ])
    expect(basemapPlaceTextField('en')).toEqual([
      'coalesce',
      ['get', 'name:en'],
      ['get', 'name'],
      ['get', 'name:id'],
    ])
  })
})
