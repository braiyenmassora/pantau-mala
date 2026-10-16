/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { TerrainIndicatorCard } from '@/components/panel/terrain-indicator-card'
import type { SoilMoistureResponse } from '@/data/extended-contract'
import { copy } from '@/copy/id'

const sampleSoil: SoilMoistureResponse = {
  data: {
    latitude: -2.75,
    longitude: 114.25,
    titik_permintaan: [114.25, -2.75],
    elevasi_mdpl: 18,
    kelembapan_tanah_0_1cm_m3m3: 0.354,
    kelembapan_tanah_3_9cm_m3m3: 0.382,
    suhu_tanah_permukaan_c: 28.5,
    waktu_model: '2026-10-17T00:00:00Z',
    provenans: {
      penyedia: 'Open-Meteo',
      endpoint: 'https://api.open-meteo.com/v1/forecast',
      sifat_data: 'modelled',
      atribusi: 'Open-Meteo',
      status: 'ok',
      validasi: 'valid',
      waktu_valid: '2026-10-17T00:00:00Z',
      waktu_tarik: '2026-10-17T04:00:00Z',
      request_id: 'fixture-request',
      catatan_kualitas: 'Modelled indicator',
    },
  },
  sumber: 'Open-Meteo',
  keterangan: 'Indikator model',
  diambil: '2026-10-17T04:00:00Z',
}

describe('TerrainIndicatorCard', () => {
  afterEach(cleanup)

  it('renders moisture percentages and elevation correctly', () => {
    render(<TerrainIndicatorCard data={sampleSoil} timeZone="WIB" />)
    expect(screen.getByRole('region', { name: copy.extra.terrainRegionLabel })).toBeTruthy()
    expect(screen.getByText('35,4%')).toBeTruthy()
    expect(screen.getByText('38,2%')).toBeTruthy()
    expect(screen.getByText('18 m')).toBeTruthy()
  })

  it('renders explicit modelled disclaimer and provenance note', () => {
    render(<TerrainIndicatorCard data={sampleSoil} timeZone="WIB" />)
    expect(
      screen.getByText(
        /Indikator model, bukan pengukuran langsung kelembapan gambut\. Tidak mengubah skor risiko\./,
      ),
    ).toBeTruthy()
  })
})
