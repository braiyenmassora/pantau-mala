import { describe, it, expect } from 'vitest'
import { decodeRegions, decodeMeta, decodeHotspots, decodeCatalog } from './go-contract'
// Explicitly synthetic fixture; never production business data.
const region = {
  kode: '99.01',
  nama: 'Fixture',
  provinsi: 'Fixture',
  zona_waktu: 'WIB',
  pusat: [114, -2],
  skor: null,
  kategori: null,
  titik_panas_24j: 10,
  tren_7h: [0, 0, 0, 0, 0, 0, 10],
  cuaca: {
    suhu_c: null,
    kondisi: '',
    kelembapan: null,
    angin_kmj: null,
    hari_tanpa_hujan: null,
  },
  udara: { pm25: null, kategori: 'pending_validation' },
  deteksi_terakhir: null,
  ringkasan: 'Fixture only',
  saran: [],
  status_indikator: 'stale',
}
describe('Go wire contract', () => {
  it('preserves missing/stale fields without invented zero or FWI', () => {
    const [r] = decodeRegions({ data: [region] })
    expect(r.risk_category).toBe('tidak_tersedia')
    expect(r.weather.temp_c).toBeNull()
    expect(r.weather_danger).toBeNull()
    expect(r.air_quality.pm25).toBeNull()
    expect(r.air_quality.category).toBe('pending_validation')
    expect(r.last_detection).toBeNull()
    expect(r.quality).toBe('stale')
  })
  it('uses server risk even when count-only Python rule differs', () => {
    expect(
      decodeRegions({
        data: [
          {
            ...region,
            skor: 40,
            kategori: 'sedang',
            status_indikator: 'pending_validation',
          },
        ],
      })[0].risk_category,
    ).toBe('sedang')
  })
  it('rejects invalid or unwrapped region responses', () => {
    expect(() => decodeRegions([region])).toThrow()
    expect(() => decodeRegions({ data: [{ ...region, tren_7h: [] }] })).toThrow()
  })
  it('maps native GeoJSON properties and nullable region code', () => {
    const fc = decodeHotspots({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [114, -2] },
          properties: {
            waktu: '2026-10-12T00:00:00Z',
            satelit: 'VIIRS NOAA-21',
            keyakinan: 'tinggi',
            frp_mw: 5,
            kode_wilayah: null,
          },
        },
      ],
    })
    expect(fc.features[0].properties).toMatchObject({
      satellite: 'VIIRS NOAA-21',
      confidence: 'tinggi',
      frp_mw: 5,
    })
    expect(fc.features[0].properties.region_code).toBeUndefined()
  })
  it('retains missing timestamps and explicit provider failures', () => {
    const meta = decodeMeta({
      data: {
        diperbarui: null,
        sumber: { firms: { status: 'gagal', diperbarui: null } },
      },
    })
    expect(meta.updated_at).toBeNull()
    expect(meta.status).toEqual({ firms: 'gagal', weather: 'gagal', air: 'gagal' })
  })
  it('unwraps the full imported catalog including empty clients', () => {
    expect(decodeCatalog({ data: { provinces: [], regencies: [] } })).toEqual({
      provinces: [],
      regencies: [],
    })
  })
})
