import type { Feature, FeatureCollection, Point } from 'geojson'

/** API contract v2 — English snake_case keys; enum values stay Indonesian. */

export type TimeZoneId = 'WIB' | 'WITA' | 'WIT'

export type RiskCategory = 'rendah' | 'sedang' | 'sangat_tinggi' | 'tidak_tersedia'

export type WeatherDangerClass = 'aman' | 'waspada' | 'bahaya' | 'ekstrem'

export type WeatherDangerSource = 'BMKG' | 'FWI dihitung'

export type AirQualityCategory =
  | 'baik'
  | 'sedang'
  | 'tidak_sehat'
  | 'sangat_tidak_sehat'
  | 'berbahaya'
  | 'pending_validation'
  | 'insufficient_data'
  | 'stale'
  | 'missing'

export type ConfidenceLevel = 'rendah' | 'sedang' | 'tinggi'

export type SourceStatus = 'ok' | 'terlambat' | 'gagal'

export type WeatherDanger = {
  class: WeatherDangerClass
  fwi: number
  source: WeatherDangerSource
}

export type Weather = {
  temp_c: number | null
  condition: string
  humidity: number | null
  wind_kmh: number | null
  dry_days: number | null
}

export type AirQuality = {
  pm25: number | null
  ispu?: number | null
  pm25_24h?: number | null
  valid_hours?: number
  category: AirQualityCategory
  method?: string
  source?: string
  status?: string
  window_end?: string | null
}

export type LastDetection = {
  time: string
  satellite: string
  confidence: ConfidenceLevel
  frp_mw: number
  village?: string
  district?: string
}

/** One regency/city row from GET /v1/regions. */
export type Region = {
  code: string
  name: string
  province: string
  time_zone: TimeZoneId
  /** [lon, lat] */
  center: [number, number]
  risk_category: RiskCategory
  weather_danger: WeatherDanger | null
  hotspots_24h: number
  trend_7d: [number, number, number, number, number, number, number]
  weather: Weather
  air_quality: AirQuality
  last_detection: LastDetection | null
  summary: string
  actions: string[]
  quality?: string
  score?: number | null
  computed_at?: string | null
  weather_updated_at?: string | null
  air_updated_at?: string | null
}

export type HotspotProperties = {
  time: string
  satellite: string
  confidence: ConfidenceLevel
  frp_mw: number
  region_code?: string
}

export type HotspotFeature = Feature<Point, HotspotProperties>

export type HotspotFeatureCollection = FeatureCollection<Point, HotspotProperties>

export type Meta = {
  updated_at: string | null
  status: {
    firms: SourceStatus
    weather: SourceStatus
    air: SourceStatus
  }
}

export type CatalogProvince = {
  code: string
  name: string
  /** [minLon, minLat, maxLon, maxLat] */
  bbox: [number, number, number, number]
  /** [lon, lat] */
  center: [number, number]
}

export type CatalogRegency = {
  code: string
  name: string
  province: string
  center: [number, number]
  time_zone: TimeZoneId
}

export type RegionCatalog = {
  note?: string
  provinces: CatalogProvince[]
  regencies: CatalogRegency[]
}
