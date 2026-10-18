import { describe, expect, it } from 'vitest'

import { buildDetectionFlag, weatherIconKind } from '@/lib/detection-flag'

describe('weatherIconKind', () => {
  it('maps condition keywords', () => {
    expect(weatherIconKind('Cerah')).toBe('sun')
    expect(weatherIconKind('Cerah berawan')).toBe('cloud')
    expect(weatherIconKind('Hujan ringan')).toBe('rain')
    expect(weatherIconKind('Kabut')).toBe('fog')
  })
})

describe('buildDetectionFlag', () => {
  it('includes name, province, temp and air with estimation marker', () => {
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
      airLabel: 'Baik (estimasi)',
      airCategory: 'baik',
    })
  })

  it('marks sedang air as udara, not bare Sedang', () => {
    expect(
      buildDetectionFlag({
        name: 'Kab. Test',
        province: 'Jambi',
        weather: {
          temp_c: 28,
          condition: 'Cerah',
          humidity: 60,
          wind_kmh: 5,
          dry_days: 0,
        },
        air_quality: { pm25: 40, category: 'sedang' },
      }).airLabel,
    ).toBe('Sedang (udara)')
  })
})
