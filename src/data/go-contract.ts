import { z } from 'zod'
import { parseRegions, parseHotspots, parseMeta, parseRegionCatalog } from './schema'
const finite = z.number().finite()
const maybe = finite.nullable()
const category = z.enum(['rendah', 'sedang', 'sangat_tinggi'])
const confidence = z.enum(['rendah', 'sedang', 'tinggi'])
const zone = z.enum(['WIB', 'WITA', 'WIT'])
const wireRegion = z.object({
  kode: z.string(),
  nama: z.string(),
  provinsi: z.string(),
  zona_waktu: zone,
  pusat: z.tuple([finite, finite]),
  skor: maybe,
  kategori: category.nullable(),
  titik_panas_24j: finite,
  tren_7h: z.array(finite).length(7),
  cuaca: z.object({
    suhu_c: maybe,
    kondisi: z.string(),
    kelembapan: maybe,
    angin_kmj: maybe,
    hari_tanpa_hujan: maybe,
  }),
  udara: z.object({
    pm25: maybe,
    ispu: maybe.optional(),
    pm25_24j: maybe.optional(),
    jam_valid: z.number().optional(),
    kategori: z.string(),
    metode: z.string().optional(),
    sumber: z.string().optional(),
    status: z.string().optional(),
    periode_selesai: z.string().nullable().optional(),
  }),
  deteksi_terakhir: z
    .object({
      waktu: z.string(),
      satelit: z.string(),
      keyakinan: confidence,
      frp_mw: finite,
    })
    .nullable(),
  ringkasan: z.string(),
  saran: z.array(z.string()),
  dihitung: z.string().nullable().optional(),
  cuaca_diperbarui: z.string().nullable().optional(),
  udara_diperbarui: z.string().nullable().optional(),
  status_indikator: z.enum(['ok', 'stale', 'missing', 'pending_validation', 'partial']),
})
export function decodeRegions(raw: unknown) {
  return parseRegions(
    z
      .object({ data: z.array(wireRegion) })
      .parse(raw)
      .data.map((r) => ({
        code: r.kode,
        name: r.nama,
        province: r.provinsi,
        time_zone: r.zona_waktu,
        center: r.pusat,
        risk_category: r.kategori ?? 'tidak_tersedia',
        weather_danger: null,
        hotspots_24h: r.titik_panas_24j,
        trend_7d: r.tren_7h,
        weather: {
          temp_c: r.cuaca.suhu_c,
          condition: r.cuaca.kondisi || 'Tidak tersedia',
          humidity: r.cuaca.kelembapan,
          wind_kmh: r.cuaca.angin_kmj,
          dry_days: r.cuaca.hari_tanpa_hujan,
        },
        air_quality: {
          pm25: r.udara.pm25,
          ispu: r.udara.ispu ?? null,
          pm25_24h: r.udara.pm25_24j ?? null,
          valid_hours: r.udara.jam_valid,
          category:
            r.udara.kategori === 'baik' ||
            r.udara.kategori === 'sedang' ||
            r.udara.kategori === 'tidak_sehat' ||
            r.udara.kategori === 'sangat_tidak_sehat' ||
            r.udara.kategori === 'berbahaya' ||
            r.udara.kategori === 'pending_validation' ||
            r.udara.kategori === 'insufficient_data' ||
            r.udara.kategori === 'stale'
              ? r.udara.kategori
              : 'missing',
          method: r.udara.metode,
          source: r.udara.sumber,
          status: r.udara.status,
          window_end: r.udara.periode_selesai,
        },
        last_detection: r.deteksi_terakhir
          ? {
              time: r.deteksi_terakhir.waktu,
              satellite: r.deteksi_terakhir.satelit,
              confidence: r.deteksi_terakhir.keyakinan,
              frp_mw: r.deteksi_terakhir.frp_mw,
            }
          : null,
        summary: r.ringkasan,
        actions: r.saran,
        quality: r.status_indikator,
        score: r.skor,
        computed_at: r.dihitung,
        weather_updated_at: r.cuaca_diperbarui,
        air_updated_at: r.udara_diperbarui,
      })),
  )
}
const props = z.object({
  waktu: z.string(),
  satelit: z.string(),
  keyakinan: confidence,
  frp_mw: finite,
  kode_wilayah: z.string().nullish(),
})
export function decodeHotspots(raw: unknown) {
  const data = z
    .object({
      type: z.literal('FeatureCollection'),
      features: z.array(
        z.object({
          type: z.literal('Feature'),
          geometry: z.object({
            type: z.literal('Point'),
            coordinates: z.tuple([finite, finite]),
          }),
          properties: props,
        }),
      ),
    })
    .parse(raw)
  return parseHotspots({
    ...data,
    features: data.features.map((f) => ({
      ...f,
      properties: {
        time: f.properties.waktu,
        satellite: f.properties.satelit,
        confidence: f.properties.keyakinan,
        frp_mw: f.properties.frp_mw,
        region_code: f.properties.kode_wilayah,
      },
    })),
  })
}
export function decodeMeta(raw: unknown) {
  const data = z
    .object({
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
    .parse(raw).data
  return parseMeta({
    updated_at: data.diperbarui,
    status: {
      firms: data.sumber.firms?.status ?? 'gagal',
      weather: data.sumber.cuaca?.status ?? 'gagal',
      air: data.sumber.udara?.status ?? 'gagal',
    },
  })
}
export function decodeCatalog(raw: unknown) {
  return parseRegionCatalog(z.object({ data: z.unknown() }).parse(raw).data)
}
