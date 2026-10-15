import { z } from 'zod'
const number = z.number().finite()
const nullable = number.nullable()
const lonLat = z.tuple([number.min(-180).max(180), number.min(-90).max(90)])
const timestamp = z.iso.datetime({ offset: true })
export const summarySchema = z.object({
  data: z.object({
    titik_panas_24j: number,
    titik_panas_kemarin: number,
    tren_7h: z.array(number).length(7),
    wilayah_sangat_tinggi: number,
    perubahan_harian: nullable,
    arah_tren: z.string(),
    jumlah_kategori: z.record(z.string(), number),
  }),
})
export const historySchema = z.object({
  data: z.array(z.object({ tanggal: z.string(), titik_panas: number, skor: nullable })),
})
export const earthquakeSchema = z.object({
      waktu: timestamp,
      pusat: lonLat,
      magnitudo: number.min(0).max(10),
      kedalaman_km: number.min(0).max(800),
      wilayah: z.string(),
      potensi: z.string(),
      dirasakan: z.string(),
      shakemap: z.string(),
})
export type Earthquake = z.infer<typeof earthquakeSchema>
export const earthquakesSchema = z.object({
  data: z.array(earthquakeSchema).max(100),
  sumber: z.string(),
  keterangan: z.string(),
  diambil: timestamp,
})
export const forecastSchema = z.object({
  data: z.object({
    kode_desa: z.string(),
    nama: z.string(),
    pusat: lonLat,
    prakiraan: z.array(
      z.object({
        waktu: z.string(),
        suhu_c: number,
        kelembapan: number,
        angin_kmj: number,
        kondisi: z.string(),
      }),
    ),
  }),
  sumber: z.string(),
  keterangan: z.string(),
  diambil: z.string(),
})
export const dischargeSchema = z
  .object({
    data: z.object({
      pusat_grid: lonLat,
      tanggal_utc: z.array(z.string()),
      debit_m3_detik: z.array(nullable),
    }),
    sumber: z.string(),
    keterangan: z.string(),
    diambil: z.string(),
  })
  .refine(
    (v) => v.data.tanggal_utc.length === v.data.debit_m3_detik.length,
    'Tanggal dan debit harus sejajar',
  )
export const sourceStatusSchema = z.object({
  data: z.object({
    diperbarui: z.string().nullable(),
    sumber: z.record(
      z.string(),
      z.object({
        status: z.enum(['ok', 'terlambat', 'gagal']),
        diperbarui: z.string().nullable(),
      }),
    ),
  }),
})
export const nearbyHotspotSchema = z.object({
  id: number,
  longitude: number,
  latitude: number,
  waktu: z.string(),
  satelit: z.string(),
  keyakinan: z.string(),
  frp_mw: number,
  kode_wilayah: z.string().nullable().optional(),
})

export const nearbyHotspotsSchema = z.object({
  data: z.array(nearbyHotspotSchema),
})

export type NearbyHotspot = z.infer<typeof nearbyHotspotSchema>
export type NearbyHotspotsResponse = z.infer<typeof nearbyHotspotsSchema>

export const windyPointSchema = z.object({
  ts: number.int().min(946684800000).max(4102444800000),
  suhu_c: number.min(-100).max(70),
  angin_u: number.min(-200).max(200),
  angin_v: number.min(-200).max(200),
  kecepatan_angin_kmj: number.min(0).max(1000),
  hembusan_kmj: number.min(0).max(1000),
  kelembapan: number.min(0).max(100),
})

export const windyForecastSchema = z.object({
  data: z.object({
    latitude: number.min(-90).max(90),
    longitude: number.min(-180).max(180),
    model: z.string().min(1),
    titik: z.array(windyPointSchema).max(2000),
  }),
  sumber: z.string(),
  keterangan: z.string(),
  diambil: timestamp,
})

export type WindyPoint = z.infer<typeof windyPointSchema>
export type WindyForecastResponse = z.infer<typeof windyForecastSchema>

export const villageSchema = z.object({
  kode: z.string(),
  nama: z.string(),
  kode_kecamatan: z.string(),
  kecamatan: z.string(),
  kode_kabupaten: z.string(),
  kabupaten: z.string(),
  kode_provinsi: z.string(),
  provinsi: z.string(),
})
export const villagesSchema = z.object({ data: z.array(villageSchema) })
export type Village = z.infer<typeof villageSchema>
