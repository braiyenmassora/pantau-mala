import { describe, expect, it } from 'vitest'

import { readSharedMapState, sharedMapPath } from '@/lib/map-url-state'

describe('shared map URL state', () => {
  it('serializes a selected hotspot into a compact shareable URL', () => {
    expect(
      sharedMapPath({
        regionCode: 'IDN.36.73',
        hotspot: {
          lat: -6.1154321,
          lon: 106.1532678,
          time: '2026-10-23T01:13:00Z',
          frpMw: 15.7,
          satellite: 'VIIRS',
        },
      }),
    ).toBe(
      '/wilayah/IDN.36.73?lat=-6.11543&lon=106.15327&at=2026-10-23T01%3A13%3A00Z&frp=15.7&sat=VIIRS',
    )
  })

  it('restores only valid region and hotspot state', () => {
    expect(
      readSharedMapState({
        pathname: '/wilayah/IDN.36.73',
        search: '?lat=-6.11543&lon=106.15327&at=2026-10-23T01%3A13%3A00Z&frp=15.7&sat=VIIRS',
      } as Location),
    ).toEqual({
      regionCode: 'IDN.36.73',
      hotspot: {
        lat: -6.11543,
        lon: 106.15327,
        time: '2026-10-23T01:13:00Z',
        frpMw: 15.7,
        satellite: 'VIIRS',
      },
    })
    expect(
      readSharedMapState({ pathname: '/wilayah/IDN.36.73', search: '?lat=bad' } as Location),
    ).toEqual({ regionCode: 'IDN.36.73', hotspot: null })
  })
})
