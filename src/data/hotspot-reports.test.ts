/** @vitest-environment jsdom */
import { afterEach, describe, expect, it } from 'vitest'

import {
  addHotspotReport,
  countAt,
  ensureDemoReports,
  listReportsAt,
  listReportsForRegion,
  pointKey,
  resetHotspotReportsForTests,
} from './hotspot-reports'

describe('hotspot-reports dummy store', () => {
  afterEach(() => {
    resetHotspotReportsForTests()
  })

  it('rounds point keys to 5 decimals', () => {
    expect(pointKey(-2.123456, 113.987654)).toBe('-2.12346,113.98765')
  })

  it('adds and lists reports at a point', () => {
    addHotspotReport({
      lat: -2.1,
      lon: 113.5,
      sighting: 'asap',
      author_name: 'Sari',
      description: 'ada asap',
      photo_url: 'https://picsum.photos/seed/t/40/40',
      region_code: 'IDN.1.1_1',
    })
    expect(countAt(-2.1, 113.5)).toBe(1)
    expect(listReportsAt(-2.100004, 113.500001)[0]?.author_name).toBe('Sari')
    expect(listReportsForRegion('IDN.1.1_1')).toHaveLength(1)
    expect(countAt(-3, 113.5)).toBe(0)
  })

  it('seeds demo reports once per point', () => {
    ensureDemoReports(-1.5, 110.2, '62.01')
    expect(countAt(-1.5, 110.2)).toBe(3)
    expect(listReportsAt(-1.5, 110.2)[0]?.photo_url).toBeTruthy()
    ensureDemoReports(-1.5, 110.2, '62.01')
    expect(countAt(-1.5, 110.2)).toBe(3)
  })

  it('persists reports to localStorage', () => {
    addHotspotReport({
      lat: -2.2,
      lon: 114.1,
      sighting: 'sudah_padam',
      author_name: 'Budi',
      photo_url: 'https://picsum.photos/seed/u/40/40',
    })
    const raw = localStorage.getItem('pantau-mala:hotspot-reports-demo-v2')
    expect(raw).toContain('sudah_padam')
    expect(raw).toContain('Budi')
  })
})
