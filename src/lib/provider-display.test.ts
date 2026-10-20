import { describe, expect, it } from 'vitest'
import {
  providerDisplayName,
  providerKindLabel,
  providerStatusLabel,
  providerValidationLabel,
} from './provider-display'

describe('provider display labels', () => {
  it('distinguishes feeds that share a provider name', () => {
    expect(providerDisplayName('bmkg_earthquakes', 'BMKG')).toBe('BMKG · Gempa')
    expect(providerDisplayName('bmkg_forecast', 'BMKG')).toBe(
      'BMKG · Prakiraan cuaca desa',
    )
    expect(providerDisplayName('openmeteo_weather', 'Open-Meteo')).toBe(
      'Open-Meteo · Cuaca wilayah',
    )
  })

  it('translates machine statuses and provenance terms', () => {
    expect(providerStatusLabel('ok')).toBe('Tersedia')
    expect(providerStatusLabel('stale')).toBe('Perlu diperbarui')
    expect(providerStatusLabel('unavailable')).toBe('Belum tersedia')
    expect(providerKindLabel('modelled')).toBe('Model')
    expect(providerValidationLabel('no_payload')).toBe('Tanpa arsip payload')
  })
})
