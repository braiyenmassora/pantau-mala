import { describe, expect, it } from 'vitest'
import { hotspotReportSchema } from './hotspot-reports'

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
