import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { useSession } from '@/auth/session'
import { getData } from './queries'

const sighting = z.enum(['asap', 'api_terlihat', 'tidak_yakin', 'sudah_padam'])
export type HotspotSighting = z.infer<typeof sighting>

export const hotspotReportSchema = z.object({
  id: z.string().uuid(),
  lat: z.number().finite(),
  lon: z.number().finite(),
  point_lat: z.number().finite(),
  point_lon: z.number().finite(),
  region_code: z.string().nullable(),
  hotspot_time: z.string().datetime({ offset: true }).nullable(),
  sighting,
  author_name: z.string().min(1).max(80),
  description: z.string().max(500).nullable(),
  photo_url: z.string().url(),
  created_at: z.string().datetime({ offset: true }),
})

export type HotspotReport = z.infer<typeof hotspotReportSchema>
export type HotspotReportPoint = { lat: number; lon: number }
export type CreateHotspotReport = z.input<typeof createHotspotReportSchema>
export type SubmitHotspotReport = Omit<CreateHotspotReport, 'photo_url'> & {
  file: File
}

const createHotspotReportSchema = z.object({
  lat: z.number().finite().min(-90).max(90),
  lon: z.number().finite().min(-180).max(180),
  region_code: z.string().min(1).optional(),
  hotspot_time: z.string().datetime({ offset: true }).optional(),
  sighting,
  author_name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(500).optional(),
  photo_url: z.string().url(),
})

const reportListSchema = z.object({ data: z.array(hotspotReportSchema) })
const reportDetailSchema = z.object({ data: hotspotReportSchema })
const reportCountsSchema = z.object({
  data: z.array(
    z.object({
      point_lat: z.number().finite(),
      point_lon: z.number().finite(),
      count: z.number().int().positive(),
    }),
  ),
})

const rounded = (value: number) => Number(value.toFixed(5))
const validPoint = ({ lat, lon }: HotspotReportPoint) =>
  Number.isFinite(lat) &&
  Number.isFinite(lon) &&
  lat >= -90 &&
  lat <= 90 &&
  lon >= -180 &&
  lon <= 180

const publicReportPhotoHost = 'pub-32d942c9574c4f02a9c7fb2e260e33e2.r2.dev'

/** Serve report photos through our Worker because the bucket's r2.dev origin is unreliable. */
export function reportPhotoSrc(photoURL: string) {
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
    // The API schema already rejects malformed URLs. Keep the original as a fallback.
  }
  return photoURL
}

function useReportQuery<T>(
  key: readonly unknown[],
  enabled: boolean,
  load: (signal: AbortSignal) => Promise<T>,
) {
  const session = useSession()
  return useQuery({
    queryKey: [...key, session.principal?.client_id, session.generation],
    enabled: enabled && session.status === 'authenticated',
    queryFn: ({ signal }) => load(signal),
    staleTime: 60_000,
  })
}

export function useRegionHotspotReports(regionCode?: string) {
  const code = regionCode?.trim() ?? ''
  return useReportQuery(['hotspot-reports', 'region', code], Boolean(code), (signal) =>
    getData(
      `/hotspot-reports?region_code=${encodeURIComponent(code)}&limit=50`,
      reportListSchema.parse,
      signal,
    ).then((v) => v.data),
  )
}

export function usePointHotspotReports(point?: HotspotReportPoint) {
  const enabled = Boolean(point && validPoint(point))
  const lat = point ? rounded(point.lat) : undefined
  const lon = point ? rounded(point.lon) : undefined
  return useReportQuery(['hotspot-reports', 'point', lat, lon], enabled, (signal) =>
    getData(
      `/hotspot-reports?point_lat=${lat}&point_lon=${lon}&limit=50`,
      reportListSchema.parse,
      signal,
    ).then((v) => v.data),
  )
}

export function useHotspotReport(id?: string) {
  const validID = Boolean(id && z.string().uuid().safeParse(id).success)
  return useReportQuery(['hotspot-reports', 'detail', id], validID, (signal) =>
    getData(`/hotspot-reports/${id}`, reportDetailSchema.parse, signal).then(
      (v) => v.data,
    ),
  )
}

export function useHotspotReportCounts(points: HotspotReportPoint[], requested = true) {
  const normalized = points
    .filter(validPoint)
    .slice(0, 100)
    .map(({ lat, lon }) => ({ lat: rounded(lat), lon: rounded(lon) }))
  const encoded = encodeURIComponent(JSON.stringify(normalized))
  return useReportQuery(
    ['hotspot-reports', 'counts', encoded],
    requested && normalized.length > 0,
    (signal) =>
      getData(
        `/hotspot-reports/counts?points=${encoded}`,
        reportCountsSchema.parse,
        signal,
      ).then((v) => v.data),
  )
}

export function useCreateHotspotReport() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({ file, ...input }: SubmitHotspotReport) => {
      const upload = await getData(
        '/hotspot-reports/photo',
        z.object({
          data: z.object({
            upload_url: z.string().url(),
            public_url: z.string().url(),
            required_headers: z.record(z.string(), z.string()),
          }),
        }).parse,
        undefined,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content_type: file.type,
            content_length: file.size,
          }),
        },
      )
      const stored = await fetch(upload.data.upload_url, {
        method: 'PUT',
        headers: upload.data.required_headers,
        body: file,
      })
      if (!stored.ok) throw new Error('Upload foto gagal.')
      const body = createHotspotReportSchema.parse({
        ...input,
        photo_url: upload.data.public_url,
      })
      return getData('/hotspot-reports', reportDetailSchema.parse, undefined, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((value) => value.data)
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ['hotspot-reports'] }),
  })
}
