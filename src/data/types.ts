import type { Feature, FeatureCollection, Point } from 'geojson'

/** API/data contract values — keep Indonesian literals from wilayah.json. */
export type TimeZoneId = 'WIB' | 'WITA' | 'WIT'

export type RiskCategory = 'rendah' | 'sedang' | 'sangat_tinggi'

export type AirQualityCategory = 'baik' | 'sedang' | 'tidak_sehat'

export type ConfidenceLevel = 'rendah' | 'sedang' | 'tinggi'

export type SourceStatus = 'ok' | 'terlambat' | 'gagal'

export type Weather = {
  suhu_c: number
  kondisi: string
  kelembapan: number
  angin_kmj: number
  hari_tanpa_hujan: number
}

export type AirQuality = {
  pm25: number
  kategori: AirQualityCategory
}

export type LastDetection = {
  waktu: string
  satelit: string
  keyakinan: ConfidenceLevel
  frp_mw: number
}

/** One kabupaten/kota row from wilayah.json (field names are the contract). */
export type Region = {
  kode: string
  nama: string
  provinsi: string
  zona_waktu: TimeZoneId
  /** [lon, lat] */
  pusat: [number, number]
  skor: number
  kategori: RiskCategory
  titik_panas_24j: number
  tren_7h: [number, number, number, number, number, number, number]
  cuaca: Weather
  udara: AirQuality
  deteksi_terakhir: LastDetection
  ringkasan: string
  saran: string[]
}

export type HotspotProperties = {
  waktu: string
  satelit: string
  keyakinan: ConfidenceLevel
  frp_mw: number
  kode_wilayah: string
}

export type HotspotFeature = Feature<Point, HotspotProperties>

export type HotspotFeatureCollection = FeatureCollection<Point, HotspotProperties>

export type Meta = {
  diperbarui: string
  status: {
    firms: SourceStatus
    cuaca: SourceStatus
    udara: SourceStatus
  }
}
