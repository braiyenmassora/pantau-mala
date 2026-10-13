import { z } from 'zod'
const number = z.number().finite()
const nullable = number.nullable()
const lonLat = z.tuple([number, number])
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
export const earthquakesSchema = z.object({
  data: z.array(
    z.object({
      waktu: z.string(),
      pusat: lonLat,
      magnitudo: number,
      kedalaman_km: number,
      wilayah: z.string(),
      potensi: z.string(),
      dirasakan: z.string(),
      shakemap: z.string(),
    }),
  ),
  sumber: z.string(),
  keterangan: z.string(),
  diambil: z.string(),
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
  ts: number,
  suhu_c: number,
  angin_u: number,
  angin_v: number,
  kecepatan_angin_kmj: number,
  hembusan_kmj: number,
  kelembapan: number,
})

export const windyForecastSchema = z.object({
  data: z.object({
    latitude: number,
    longitude: number,
    model: z.string(),
    titik: z.array(windyPointSchema),
  }),
  sumber: z.string(),
  keterangan: z.string(),
  diambil: z.string(),
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
