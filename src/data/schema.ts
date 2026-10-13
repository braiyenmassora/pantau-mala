import { z } from 'zod'

import type { HotspotFeatureCollection, Meta, Region, RegionCatalog } from '@/data/types'

const timeZoneId = z.enum(['WIB', 'WITA', 'WIT'])
const riskCategory = z.enum(['rendah', 'sedang', 'sangat_tinggi', 'tidak_tersedia'])
const weatherDangerClass = z.enum(['aman', 'waspada', 'bahaya', 'ekstrem'])
const weatherDangerSource = z.enum(['BMKG', 'FWI dihitung'])
const airQualityCategory = z.enum([
  'baik',
  'sedang',
  'tidak_sehat',
  'sangat_tidak_sehat',
  'berbahaya',
  'pending_validation',
  'insufficient_data',
  'stale',
  'missing',
])
const confidenceLevel = z.enum(['rendah', 'sedang', 'tinggi'])
const sourceStatus = z.enum(['ok', 'terlambat', 'gagal'])
const lonLat = z.tuple([z.number(), z.number()])

const weatherDangerSchema = z.object({
  class: weatherDangerClass,
  fwi: z.number(),
  source: weatherDangerSource,
})

const weatherSchema = z.object({
  temp_c: z.number().nullable(),
  condition: z.string(),
  humidity: z.number().nullable(),
  wind_kmh: z.number().nullable(),
  dry_days: z.number().nullable(),
})

const airQualitySchema = z.object({
  pm25: z.number().nullable(),
  ispu: z.number().nullable().optional(),
  pm25_24h: z.number().nullable().optional(),
  valid_hours: z.number().optional(),
  category: airQualityCategory,
  method: z.string().optional(),
  source: z.string().optional(),
  status: z.string().optional(),
  window_end: z.string().nullable().optional(),
})

/** BE may send JSON null for missing optional strings. */
const optionalString = z
  .string()
  .nullish()
  .transform((v) => v ?? undefined)

const lastDetectionSchema = z.object({
  time: z.string(),
  satellite: z.string(),
  confidence: confidenceLevel,
  frp_mw: z.number(),
  village: optionalString,
  district: optionalString,
})

export const regionSchema = z.object({
  code: z.string(),
  name: z.string(),
  province: z.string(),
  time_zone: timeZoneId,
  center: lonLat,
  risk_category: riskCategory,
  weather_danger: weatherDangerSchema.nullable(),
  hotspots_24h: z.number(),
  trend_7d: z.tuple([
    z.number(),
    z.number(),
    z.number(),
    z.number(),
    z.number(),
    z.number(),
    z.number(),
  ]),
  weather: weatherSchema,
  air_quality: airQualitySchema,
  last_detection: lastDetectionSchema.nullable(),
  summary: z.string(),
  actions: z.array(z.string()),
  quality: z.string().optional(),
  score: z.number().nullable().optional(),
  computed_at: z.string().nullable().optional(),
  weather_updated_at: z.string().nullable().optional(),
  air_updated_at: z.string().nullable().optional(),
})

export const regionsSchema = z.array(regionSchema)

export const metaSchema = z.object({
  updated_at: z.string().nullable(),
  status: z.object({
    firms: sourceStatus,
    weather: sourceStatus,
    air: sourceStatus,
  }),
})

const hotspotPropertiesSchema = z.object({
  time: z.string(),
  satellite: z.string(),
  confidence: confidenceLevel,
  frp_mw: z.number(),
  // exclude_none: sering absen (~2%)
  region_code: optionalString,
})

export const hotspotsSchema = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(
    z.object({
      type: z.literal('Feature'),
      geometry: z.object({
        type: z.literal('Point'),
        coordinates: lonLat,
      }),
      properties: hotspotPropertiesSchema,
    }),
  ),
})

const catalogProvinceSchema = z.object({
  code: z.string(),
  name: z.string(),
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  center: lonLat,
})

const catalogRegencySchema = z.object({
  code: z.string(),
  name: z.string(),
  province: z.string(),
  center: lonLat,
  time_zone: timeZoneId,
})

export const regionCatalogSchema = z.object({
  note: z.string().optional(),
  provinces: z.array(catalogProvinceSchema),
  regencies: z.array(catalogRegencySchema),
})

export function parseRegions(data: unknown): Region[] {
  return regionsSchema.parse(data) as Region[]
}

export function parseMeta(data: unknown): Meta {
  return metaSchema.parse(data) as Meta
}

export function parseHotspots(data: unknown): HotspotFeatureCollection {
  return hotspotsSchema.parse(data) as HotspotFeatureCollection
}

export function parseRegionCatalog(data: unknown): RegionCatalog {
  return regionCatalogSchema.parse(data) as RegionCatalog
}
