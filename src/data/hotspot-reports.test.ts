import { describe, expect, it } from 'vitest'

import {
  decodeHotspotReport,
  decodeHotspotReports,
  decodeReportCounts,
  pointKey,
  reportPhotoSrc,
} from './hotspot-reports'

const wireReport = {
  id: 'e9170c75-3623-4471-9ca5-4f2c4f9f86fd',
  lat: -2.1000042,
  lon: 113.5000039,
  point_lat: -2.1,
  point_lon: 113.5,
  region_code: null,
  hotspot_time: null,
  sighting: 'asap',
  author_name: 'Sari W.',
  description: null,
  photo_url: 'https://media.example/report.jpg',
  created_at: '2026-10-19T03:15:00Z',
}

describe('hotspot-reports API decoding', () => {
  it('rounds point keys to 5 decimals', () => {
    expect(pointKey(-2.123456, 113.987654)).toBe('-2.12346,113.98765')
  })

  it('maps BE nullables to undefined', () => {
    const [report] = decodeHotspotReports({ data: [wireReport] })
    expect(report).toMatchObject({
      id: wireReport.id,
      sighting: 'asap',
      photo_url: wireReport.photo_url,
    })
    expect(report?.region_code).toBeUndefined()
    expect(report?.hotspot_time).toBeUndefined()
    expect(report?.description).toBeUndefined()
  })

  it('keeps filled optional fields and decodes a single report', () => {
    const report = decodeHotspotReport({
      data: {
        ...wireReport,
        region_code: '62.01',
        hotspot_time: '2026-10-18T12:00:00Z',
        description: 'Asap ke utara.',
      },
    })
    expect(report.region_code).toBe('62.01')
    expect(report.hotspot_time).toBe('2026-10-18T12:00:00Z')
    expect(report.description).toBe('Asap ke utara.')
  })

  it('rejects unknown sighting values', () => {
    expect(() =>
      decodeHotspotReports({ data: [{ ...wireReport, sighting: 'lainnya' }] }),
    ).toThrow()
  })

  it('rewrites public R2 photo URLs to the Worker photo route', () => {
    expect(
      reportPhotoSrc(
        'https://pub-32d942c9574c4f02a9c7fb2e260e33e2.r2.dev/hotspot-reports/client-1/foto.jpg',
      ),
    ).toBe('/report-photos/hotspot-reports/client-1/foto.jpg')
    expect(reportPhotoSrc('https://media.example/report.jpg')).toBe(
      'https://media.example/report.jpg',
    )
    expect(
      reportPhotoSrc(
        'https://pub-32d942c9574c4f02a9c7fb2e260e33e2.r2.dev/lain/foto.jpg',
      ),
    ).toContain('r2.dev')
    expect(reportPhotoSrc('bukan-url')).toBe('bukan-url')
  })

  it('builds a count map keyed by rounded point; absent points stay absent', () => {
    const counts = decodeReportCounts({
      data: [{ point_lat: -2.1, point_lon: 113.5, count: 3 }],
    })
    expect(counts.get(pointKey(-2.1000042, 113.5000039))).toBe(3)
    expect(counts.get(pointKey(-3, 113.5))).toBeUndefined()
  })
})
