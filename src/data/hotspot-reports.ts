import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'

import { useSession } from '@/auth/session'
import { getCopy } from '@/copy'
import { getData } from './queries'

/** Round ~1 m — kunci tampilan per titik (server membulatkan 5 desimal). */
export function pointKey(lat: number, lon: number): string {
  return `${lat.toFixed(5)},${lon.toFixed(5)}`
}

const publicReportPhotoHost = 'pub-32d942c9574c4f02a9c7fb2e260e33e2.r2.dev'

/** Foto dilayani Worker sendiri (/report-photos) karena host r2.dev tidak andal. */
export function reportPhotoSrc(photoURL: string): string {
  try {
    const url = new URL(photoURL)
    if (
      url.protocol === 'https:' &&
      url.hostname === publicReportPhotoHost &&
      url.pathname.startsWith('/hotspot-reports/')
    ) {
      return `/report-photos${url.pathname}`
    }
  } catch {
    // Schema API sudah menolak URL rusak; pakai URL asli sebagai cadangan.
  }
  return photoURL
}

export const hotspotSightingSchema = z.enum([
  'asap',
  'api_terlihat',
  'tidak_yakin',
  'sudah_padam',
])

export type HotspotSighting = z.infer<typeof hotspotSightingSchema>

/** Bentuk wire BE: field opsional dikirim sebagai null. */
const wireReportSchema = z.object({
  id: z.string().uuid(),
  lat: z.number(),
  lon: z.number(),
  point_lat: z.number(),
  point_lon: z.number(),
  region_code: z.string().nullable(),
  hotspot_time: z.string().nullable(),
  sighting: hotspotSightingSchema,
  author_name: z.string().min(1).max(80),
  description: z.string().nullable(),
  photo_url: z.string().min(1),
  created_at: z.string(),
})

export type HotspotReport = {
  id: string
  lat: number
  lon: number
  point_lat: number
  point_lon: number
  region_code?: string
  hotspot_time?: string
  sighting: HotspotSighting
  author_name: string
  description?: string
  photo_url: string
  created_at: string
}

function toReport(w: z.infer<typeof wireReportSchema>): HotspotReport {
  return {
    id: w.id,
    lat: w.lat,
    lon: w.lon,
    point_lat: w.point_lat,
    point_lon: w.point_lon,
    region_code: w.region_code ?? undefined,
    hotspot_time: w.hotspot_time ?? undefined,
    sighting: w.sighting,
    author_name: w.author_name,
    description: w.description ?? undefined,
    photo_url: w.photo_url,
    created_at: w.created_at,
  }
}

export function decodeHotspotReports(raw: unknown): HotspotReport[] {
  return z
    .object({ data: z.array(wireReportSchema) })
    .parse(raw)
    .data.map(toReport)
}

export function decodeHotspotReport(raw: unknown): HotspotReport {
  return toReport(z.object({ data: wireReportSchema }).parse(raw).data)
}

/** Titik tanpa laporan tidak dikembalikan BE — anggap 0 di pemanggil. */
export function decodeReportCounts(raw: unknown): Map<string, number> {
  const { data } = z
    .object({
      data: z.array(
        z.object({ point_lat: z.number(), point_lon: z.number(), count: z.number() }),
      ),
    })
    .parse(raw)
  return new Map(data.map((c) => [pointKey(c.point_lat, c.point_lon), c.count]))
}

export type ReportRegionCount = { region_code: string; count: number }

export function decodeReportRegionCounts(raw: unknown): ReportRegionCount[] {
  return z
    .object({
      data: z.array(z.object({ region_code: z.string(), count: z.number() })),
    })
    .parse(raw).data
}

export function decodeReportTotal(raw: unknown): number {
  return z.object({ data: z.object({ count: z.number() }) }).parse(raw).data.count
}

export type HotspotReportTarget = {
  lat: number
  lon: number
  region_code?: string
  hotspot_time?: string
}

export type CreateHotspotReportInput = HotspotReportTarget & {
  sighting: HotspotSighting
  author_name: string
  description?: string
  file: File
}

const photoUploadSchema = z.object({
  data: z.object({
    upload_url: z.string(),
    public_url: z.string(),
    required_headers: z.record(z.string(), z.string()),
  }),
})

/** Alur BE v1: minta URL upload → PUT file ke storage → buat laporan. */
async function createHotspotReport(
  input: CreateHotspotReportInput,
): Promise<HotspotReport> {
  const { file, ...fields } = input
  const upload = await getData(
    '/hotspot-reports/photo',
    (raw) => photoUploadSchema.parse(raw).data,
    undefined,
    {
      method: 'POST',
      body: JSON.stringify({ content_type: file.type, content_length: file.size }),
    },
  )
  const stored = await fetch(upload.upload_url, {
    method: 'PUT',
    headers: upload.required_headers,
    body: file,
  })
  if (!stored.ok) throw new Error(getCopy().errors.photoUploadFailed)
  // Payload create laporan — persis kontrak BE, jangan tambah field lain.
  const payload = {
    lat: fields.lat,
    lon: fields.lon,
    region_code: fields.region_code,
    hotspot_time: fields.hotspot_time,
    sighting: fields.sighting,
    author_name: fields.author_name,
    description: fields.description ?? '',
    photo_url: upload.public_url,
  }
  return getData('/hotspot-reports', decodeHotspotReport, undefined, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

function useReportQuery<T>(
  key: readonly unknown[],
  load: (signal: AbortSignal) => Promise<T>,
  enabled: boolean,
) {
  const session = useSession()
  return useQuery({
    queryKey: [...key, session.principal?.client_id, session.generation],
    enabled: session.status === 'authenticated' && enabled,
    queryFn: ({ signal }) => load(signal),
    staleTime: 60 * 1000,
  })
}

export function useRegionReports(regionCode: string) {
  return useReportQuery(
    ['hotspot-reports', 'region', regionCode],
    (signal) =>
      getData(
        `/hotspot-reports?region_code=${encodeURIComponent(regionCode)}&limit=50`,
        decodeHotspotReports,
        signal,
      ),
    Boolean(regionCode),
  )
}

export function useHotspotReport(id: string) {
  return useReportQuery(
    ['hotspot-reports', 'detail', id],
    (signal) =>
      getData(`/hotspot-reports/${encodeURIComponent(id)}`, decodeHotspotReport, signal),
    Boolean(id),
  )
}

/** Counts dibaca per batch maks 100 titik (batas BE). */
export function useReportCounts(points: Array<{ lat: number; lon: number }>) {
  const key = points.map((p) => pointKey(p.lat, p.lon)).join('|')
  return useReportQuery(
    ['hotspot-reports', 'counts', key],
    async (signal) => {
      const merged = new Map<string, number>()
      for (let i = 0; i < points.length; i += 100) {
        const chunk = points.slice(i, i + 100)
        const counts = await getData(
          `/hotspot-reports/counts?points=${encodeURIComponent(JSON.stringify(chunk))}`,
          decodeReportCounts,
          signal,
        )
        for (const [k, v] of counts) merged.set(k, v)
      }
      return merged
    },
    points.length > 0,
  )
}

/** Total semua laporan warga klien ini (angka kartu ringkasan beranda). */
export function useTotalReports() {
  return useReportQuery(
    ['hotspot-reports', 'total'],
    (signal) => getData('/hotspot-reports/total', decodeReportTotal, signal),
    true,
  )
}

/** Jumlah laporan per kab/kota untuk daftar berkelompok provinsi. */
export function useReportCountsByRegion() {
  return useReportQuery(
    ['hotspot-reports', 'counts-by-region'],
    (signal) =>
      getData('/hotspot-reports/counts/by-region', decodeReportRegionCounts, signal),
    true,
  )
}

export function useCreateHotspotReport() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: createHotspotReport,
    onSuccess: () => client.invalidateQueries({ queryKey: ['hotspot-reports'] }),
  })
}
