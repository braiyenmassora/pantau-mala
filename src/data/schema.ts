import { z } from 'zod'

import type {
  DaftarWilayah,
  HotspotFeatureCollection,
  Meta,
  Region,
} from '@/data/types'

const timeZoneId = z.enum(['WIB', 'WITA', 'WIT'])
const riskCategory = z.enum(['rendah', 'sedang', 'sangat_tinggi'])
const airQualityCategory = z.enum(['baik', 'sedang', 'tidak_sehat'])
const confidenceLevel = z.enum(['rendah', 'sedang', 'tinggi'])
const sourceStatus = z.enum(['ok', 'terlambat', 'gagal'])
const lonLat = z.tuple([z.number(), z.number()])

const weatherSchema = z.object({
  suhu_c: z.number(),
  kondisi: z.string(),
  kelembapan: z.number(),
  angin_kmj: z.number(),
  hari_tanpa_hujan: z.number(),
})

const airQualitySchema = z.object({
  pm25: z.number(),
  kategori: airQualityCategory,
})

const lastDetectionSchema = z.object({
  waktu: z.string(),
  satelit: z.string(),
  keyakinan: confidenceLevel,
  frp_mw: z.number(),
})

export const regionSchema = z.object({
  kode: z.string(),
  nama: z.string(),
  provinsi: z.string(),
  zona_waktu: timeZoneId,
  pusat: lonLat,
  skor: z.number(),
  kategori: riskCategory,
  titik_panas_24j: z.number(),
  tren_7h: z.tuple([
    z.number(),
    z.number(),
    z.number(),
    z.number(),
    z.number(),
    z.number(),
    z.number(),
  ]),
  cuaca: weatherSchema,
  udara: airQualitySchema,
  deteksi_terakhir: lastDetectionSchema,
  ringkasan: z.string(),
  saran: z.array(z.string()),
})

export const regionsSchema = z.array(regionSchema)

export const metaSchema = z.object({
  diperbarui: z.string(),
  status: z.object({
    firms: sourceStatus,
    cuaca: sourceStatus,
    udara: sourceStatus,
  }),
})

const hotspotPropertiesSchema = z.object({
  waktu: z.string(),
  satelit: z.string(),
  keyakinan: confidenceLevel,
  frp_mw: z.number(),
  kode_wilayah: z.string(),
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
  kode: z.string(),
  nama: z.string(),
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  pusat: lonLat,
})

const catalogKabKotaSchema = z.object({
  kode: z.string(),
  nama: z.string(),
  provinsi: z.string(),
  pusat: lonLat,
  zona_waktu: timeZoneId,
})

export const daftarWilayahSchema = z.object({
  _catatan: z.string().optional(),
  provinsi: z.array(catalogProvinceSchema),
  kabkota: z.array(catalogKabKotaSchema),
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

export function parseDaftarWilayah(data: unknown): DaftarWilayah {
  return daftarWilayahSchema.parse(data) as DaftarWilayah
}
