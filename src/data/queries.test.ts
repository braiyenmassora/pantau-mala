import { describe, expect, it } from 'vitest'

import { hotspotQueryPath } from '@/data/queries'

describe('hotspotQueryPath', () => {
  it('sends the selected region to the server', () => {
    expect(hotspotQueryPath({ regionCode: '64.03' })).toBe(
      '/hotspots.geojson?kode_wilayah=64.03',
    )
  })

  it('sends a province bounding box to the server', () => {
    expect(hotspotQueryPath({ bbox: [108, -3, 114, 2] })).toBe(
      '/hotspots.geojson?bbox=108%2C-3%2C114%2C2',
    )
  })

  it('does not send malformed filters', () => {
    expect(hotspotQueryPath({ regionCode: 'IDN.1.1_1' })).toBe('/hotspots.geojson')
    expect(hotspotQueryPath({ bbox: [114, 2, 108, -3] })).toBe('/hotspots.geojson')
  })
})
