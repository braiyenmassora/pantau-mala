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
  titik_embun_c: number.min(-100).max(70).nullable().optional(),
  curah_hujan_3j_mm: number.min(0).max(10000).nullable().optional(),
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
    mode_key: z.enum(['production', 'testing', 'unverified']).optional(),
    titik_ditolak: number.int().min(0).optional(),
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

const provenanceSchema = z.object({
  penyedia: z.string().min(1),
  endpoint: z.url(),
  sifat_data: z.enum(['observed', 'modelled', 'derived', 'contextual']),
  atribusi: z.string().min(1),
  status: z.enum(['ok', 'stale', 'unavailable']),
  validasi: z.string().min(1),
  waktu_valid: timestamp.nullable().optional(),
  waktu_observasi: timestamp.nullable().optional(),
  berlaku_hingga: timestamp.nullable().optional(),
  waktu_tarik: timestamp,
  request_id: z.string().min(1),
  catatan_kualitas: z.string().optional(),
})

export const providerRegistrySchema = z.object({
  data: z.array(
    z.object({
      id: z.string().min(1),
      provider: z.string().min(1),
      endpoint: z.url(),
      kind: z.enum(['observed', 'modelled', 'derived', 'contextual']),
      attribution: z.string().min(1),
      license: z.string().min(1),
      raw_unit: z.string(),
      normalized_unit: z.string(),
      latest: z.unknown().nullable(),
      status: z.enum(['ok', 'stale', 'unavailable']),
    }),
  ),
})

export const soilMoistureSchema = z.object({
  data: z.object({
    latitude: number.min(-90).max(90),
    longitude: number.min(-180).max(180),
    titik_permintaan: lonLat,
    elevasi_mdpl: number.min(-500).max(10000).nullable(),
    kelembapan_tanah_0_1cm_m3m3: number.min(0).max(1).nullable(),
    kelembapan_tanah_3_9cm_m3m3: number.min(0).max(1).nullable(),
    suhu_tanah_permukaan_c: number.min(-100).max(100).nullable(),
    waktu_model: timestamp.nullable(),
    provenans: provenanceSchema.extend({ sifat_data: z.literal('modelled') }),
  }),
  sumber: z.string(),
  keterangan: z.string(),
  diambil: timestamp,
})
export type SoilMoistureResponse = z.infer<typeof soilMoistureSchema>

const sourceUrl = z.url().refine((value) => /^https?:\/\//i.test(value))
const lineCoordinates = z.array(lonLat).min(2)
const polygonCoordinates = z.array(z.array(lonLat).min(4)).min(1)
const geometrySchema = z.discriminatedUnion('tipe', [
  z.object({ waktu: timestamp, tipe: z.literal('Point'), koordinat: lonLat }),
  z.object({
    waktu: timestamp,
    tipe: z.literal('Polygon'),
    koordinat: polygonCoordinates,
  }),
  z.object({
    waktu: timestamp,
    tipe: z.literal('LineString'),
    koordinat: lineCoordinates,
  }),
  z.object({
    waktu: timestamp,
    tipe: z.literal('MultiPoint'),
    koordinat: z.array(lonLat).min(1),
  }),
  z.object({
    waktu: timestamp,
    tipe: z.literal('MultiLineString'),
    koordinat: z.array(lineCoordinates).min(1),
  }),
  z.object({
    waktu: timestamp,
    tipe: z.literal('MultiPolygon'),
    koordinat: z.array(polygonCoordinates).min(1),
  }),
])

export const nasaEonetEventSchema = z.object({
  id: z.string().min(1),
  judul: z.string().min(1),
  deskripsi: z.string().optional(),
  link: sourceUrl.optional(),
  ditutup: timestamp.nullable().optional(),
  kategori: z.array(z.string()),
  sumber_primer: z.array(sourceUrl),
  geometri: z.array(geometrySchema).min(1).max(5000),
})

export const nasaEonetCatalogSchema = z.object({
  data: z
    .object({
      events: z.array(nasaEonetEventSchema).max(100),
      jumlah: z.number().int().min(0),
      provenans: provenanceSchema.extend({ sifat_data: z.literal('contextual') }),
    })
    .refine(
      (value) =>
        value.jumlah === value.events.length &&
        new Set(value.events.map((event) => event.id)).size === value.events.length,
    ),
  sumber: z.string(),
  keterangan: z.string(),
  diambil: timestamp,
})
export type NASAEONETCatalogResponse = z.infer<typeof nasaEonetCatalogSchema>
