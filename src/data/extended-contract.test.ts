import { describe, it, expect } from 'vitest'
import {
  summarySchema,
  historySchema,
  earthquakesSchema,
  forecastSchema,
  dischargeSchema,
  sourceStatusSchema,
  soilMoistureSchema,
  providerProvenanceSchema,
} from './extended-contract'
const envelope = {
  sumber: 'Synthetic fixture only',
  keterangan: 'Not live business data.',
  diambil: '2026-10-12T00:00:00Z',
}
describe('extended Go source contracts', () => {
  it('keeps null daily changes instead of inventing percentages', () => {
    const value = summarySchema.parse({
      data: {
        titik_panas_24j: 1,
        titik_panas_kemarin: 0,
        tren_7h: [0, 0, 0, 0, 0, 0, 1],
        wilayah_sangat_tinggi: 0,
        perubahan_harian: null,
        arah_tren: 'naik',
        jumlah_kategori: { rendah: 1 },
      },
    })
    expect(value.data.perubahan_harian).toBeNull()
  })
  it('keeps uncomputed historic score null', () => {
    expect(
      historySchema.parse({
        data: [{ tanggal: '2026-10-12', titik_panas: 0, skor: null }],
      }).data[0].skor,
    ).toBeNull()
  })
  it('preserves source labels and BMKG event properties', () => {
    const value = earthquakesSchema.parse({
      ...envelope,
      data: [
        {
          waktu: envelope.diambil,
          pusat: [114, -2],
          magnitudo: 4,
          kedalaman_km: 10,
          wilayah: 'Synthetic region',
          potensi: 'Synthetic text',
          dirasakan: 'Synthetic text',
          shakemap: '',
        },
      ],
    })
    expect(value.data[0].pusat).toEqual([114, -2])
    expect(value.keterangan).toBe(envelope.keterangan)
  })
  it('requires actual village code and forecast fields in response', () => {
    expect(
      forecastSchema.parse({
        ...envelope,
        data: {
          kode_desa: '99.01.01.1001',
          nama: 'Synthetic village',
          pusat: [114, -2],
          prakiraan: [],
        },
      }).data.prakiraan,
    ).toEqual([])
    expect(() =>
      forecastSchema.parse({ ...envelope, data: { kode_desa: '99.01' } }),
    ).toThrow()
  })
  it('preserves missing river values and rejects misaligned dates', () => {
    const data = {
      pusat_grid: [114, -2],
      tanggal_utc: ['2026-10-12'],
      debit_m3_detik: [null],
    }
    expect(dischargeSchema.parse({ ...envelope, data }).data.debit_m3_detik[0]).toBeNull()
    expect(() =>
      dischargeSchema.parse({ ...envelope, data: { ...data, debit_m3_detik: [] } }),
    ).toThrow()
  })
  it('retains per-sensor freshness and absent timestamps', () => {
    const value = sourceStatusSchema.parse({
      data: {
        diperbarui: null,
        sumber: { VIIRS_NOAA21_NRT: { status: 'gagal', diperbarui: null } },
      },
    })
    expect(value.data.sumber.VIIRS_NOAA21_NRT).toEqual({
      status: 'gagal',
      diperbarui: null,
    })
  })
  it('parses provider provenance used by the source disclosure', () => {
    const value = providerProvenanceSchema.parse({
      data: [
        {
          penyedia: 'NASA FIRMS',
          endpoint: 'https://firms.modaps.eosdis.nasa.gov/api/area',
          sifat_data: 'observed',
          atribusi: 'NASA FIRMS',
          status: 'ok',
          validasi: 'valid',
          waktu_tarik: '2026-10-19T12:00:00Z',
          request_id: 'synthetic-request',
        },
      ],
    })
    expect(value.data[0].penyedia).toBe('NASA FIRMS')
  })
})

describe('SoilMoisture and NASAEONET contract schemas', () => {
  it('parses valid soil moisture and rejects invalid values', () => {
    const valid = {
      data: {
        latitude: -6.2,
        longitude: 106.8,
        titik_permintaan: [106.8, -6.2],
        elevasi_mdpl: 25,
        kelembapan_tanah_0_1cm_m3m3: 0.35,
        kelembapan_tanah_3_9cm_m3m3: 0.38,
        suhu_tanah_permukaan_c: 29.5,
        waktu_model: '2026-10-17T00:00:00Z',
        provenans: {
          penyedia: 'Open-Meteo',
          endpoint: 'https://api.open-meteo.com/v1/forecast',
          sifat_data: 'modelled',
          atribusi: 'Open-Meteo',
          status: 'ok',
          validasi: 'valid',
          waktu_tarik: '2026-10-17T04:00:00Z',
          request_id: 'test-req',
        },
      },
      sumber: 'Open-Meteo',
      keterangan: 'Indikator model',
      diambil: '2026-10-17T04:00:00Z',
    }
    expect(soilMoistureSchema.parse(valid)).toBeTruthy()

    // Out of range moisture (> 1.0) must fail
    expect(() =>
      soilMoistureSchema.parse({
        ...valid,
        data: { ...valid.data, kelembapan_tanah_0_1cm_m3m3: 1.5 },
      }),
    ).toThrow()
  })
})
