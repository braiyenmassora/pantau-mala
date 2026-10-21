import { describe, expect, it } from 'vitest'
import { hotspotReportSchema, reportPhotoSrc } from './hotspot-reports'

describe('reportPhotoSrc', () => {
  it('routes public R2 report photos through the same-origin Worker', () => {
    expect(
      reportPhotoSrc(
        'https://pub-32d942c9574c4f02a9c7fb2e260e33e2.r2.dev/hotspot-reports/e48b7f4b-d811-4519-9f20-bc35de0e3bff/5da70a8a-2440-464a-8c9e-6655b316ad32.png',
      ),
    ).toBe(
      '/report-photos/hotspot-reports/e48b7f4b-d811-4519-9f20-bc35de0e3bff/5da70a8a-2440-464a-8c9e-6655b316ad32.png',
    )
  })

  it('leaves unrelated image origins unchanged', () => {
    expect(reportPhotoSrc('https://media.example/report.jpg')).toBe(
      'https://media.example/report.jpg',
    )
  })
})

describe('hotspot report contract', () => {
  it('accepts the Go OpenAPI response shape', () => {
    expect(hotspotReportSchema.parse({
      id: 'e9170c75-3623-4471-9ca5-4f2c4f9f86fd', lat: -2.1000042, lon: 113.5000039,
      point_lat: -2.1, point_lon: 113.5, region_code: 'IDN.1.1_1', hotspot_time: '2026-10-18T12:00:00Z',
      sighting: 'asap', author_name: 'Sari W.', description: null,
      photo_url: 'https://media.example/report.jpg', created_at: '2026-10-19T03:15:00Z',
    }).point_lat).toBe(-2.1)
  })
})
