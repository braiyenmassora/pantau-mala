import { describe, expect, it } from 'vitest'

import {
  buildDetectionFlag,
  formatDetectionDate,
  weatherIconKind,
} from '@/lib/detection-flag'

describe('formatDetectionDate', () => {
  it('formats full Indonesian month with seconds in zone', () => {
    expect(formatDetectionDate('2026-10-09T20:52:00.000Z', 'WIT')).toBe(
      '10 Oktober 2026 05:52:00',
    )
  })
})

describe('weatherIconKind', () => {
  it('maps condition keywords', () => {
    expect(weatherIconKind('Cerah')).toBe('sun')
    expect(weatherIconKind('Cerah berawan')).toBe('cloud')
    expect(weatherIconKind('Hujan ringan')).toBe('rain')
    expect(weatherIconKind('Kabut')).toBe('fog')
  })
})

describe('buildDetectionFlag', () => {
  it('includes name, province, temp and air', () => {
    expect(
      buildDetectionFlag({
        name: 'Kab. Merauke',
        province: 'Papua Selatan',
        weather: {
          temp_c: 30,
          condition: 'Hujan ringan',
          humidity: 72,
          wind_kmh: 10,
          dry_days: 1,
        },
        air_quality: { pm25: 8.1, category: 'baik' },
      }),
    ).toEqual({
      title: 'Kab. Merauke',
      subtitle: 'Provinsi Papua Selatan',
      tempLabel: '30°C',
      weatherKind: 'rain',
      airLabel: 'Baik',
      airCategory: 'baik',
    })
  })
})
