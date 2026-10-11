import type { Feature, FeatureCollection, Point } from 'geojson'

/** API contract v2 — English snake_case keys; enum values stay Indonesian. */

export type TimeZoneId = 'WIB' | 'WITA' | 'WIT'

export type RiskCategory = 'rendah' | 'sedang' | 'sangat_tinggi'

export type WeatherDangerClass = 'aman' | 'waspada' | 'bahaya' | 'ekstrem'

export type WeatherDangerSource = 'BMKG' | 'FWI dihitung'

export type AirQualityCategory = 'baik' | 'sedang' | 'tidak_sehat'

export type ConfidenceLevel = 'rendah' | 'sedang' | 'tinggi'

export type SourceStatus = 'ok' | 'terlambat' | 'gagal'

export type WeatherDanger = {
  class: WeatherDangerClass
  fwi: number
  source: WeatherDangerSource
}

export type Weather = {
  temp_c: number
  condition: string
  humidity: number
  wind_kmh: number
  dry_days: number
}

export type AirQuality = {
  pm25: number
  category: AirQualityCategory
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
  weather_danger: WeatherDanger
  hotspots_24h: number
  trend_7d: [number, number, number, number, number, number, number]
  weather: Weather
  air_quality: AirQuality
  last_detection: LastDetection
  summary: string
  actions: string[]
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
  updated_at: string
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
