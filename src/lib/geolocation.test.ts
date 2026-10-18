import { describe, expect, it } from 'vitest'

import {
  isWithinIndonesiaLoose,
  locationFromCoords,
  INDONESIA_LOCATION_PAD_DEG,
} from '@/lib/geolocation'
import { INDONESIA_BOUNDS } from '@/lib/indonesia-view'

describe('isWithinIndonesiaLoose', () => {
  it('accepts a point inside the map bbox', () => {
    expect(isWithinIndonesiaLoose(-2, 118)).toBe(true)
  })

  it('accepts points just outside the map bbox within pad', () => {
    const [[minLon, minLat], [maxLon, maxLat]] = INDONESIA_BOUNDS
    const pad = INDONESIA_LOCATION_PAD_DEG
    expect(isWithinIndonesiaLoose(minLat - pad + 0.1, minLon - pad + 0.1)).toBe(true)
    expect(isWithinIndonesiaLoose(maxLat + pad - 0.1, maxLon + pad - 0.1)).toBe(true)
  })

  it('rejects points beyond the loose pad', () => {
    expect(isWithinIndonesiaLoose(35.7, 139.7)).toBe(false) // Tokyo
    expect(isWithinIndonesiaLoose(-33.9, 151.2)).toBe(false) // Sydney
  })
})

describe('locationFromCoords', () => {
  it('marks Jakarta as active', () => {
    expect(locationFromCoords(-6.2, 106.8)).toEqual({
      status: 'active',
      coords: { lat: -6.2, lon: 106.8 },
    })
  })

  it('marks overseas coords as outside without dropping coords', () => {
    expect(locationFromCoords(35.7, 139.7)).toEqual({
      status: 'outside',
      coords: { lat: 35.7, lon: 139.7 },
    })
  })
})
