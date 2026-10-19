import { z } from 'zod'

/** Round ~1 m — kunci tampilan per titik (selaras rencana BE). */
export function pointKey(lat: number, lon: number): string {
  return `${lat.toFixed(5)},${lon.toFixed(5)}`
}

export const hotspotSightingSchema = z.enum([
  'asap',
  'api_terlihat',
  'tidak_yakin',
  'sudah_padam',
])

export type HotspotSighting = z.infer<typeof hotspotSightingSchema>

export const hotspotReportSchema = z.object({
  id: z.string().uuid(),
  lat: z.number(),
  lon: z.number(),
  point_lat: z.number(),
  point_lon: z.number(),
  region_code: z.string().optional(),
  hotspot_time: z.string().datetime().optional(),
  sighting: hotspotSightingSchema,
  author_name: z.string().min(1).max(80),
  description: z.string().max(500).optional(),
  /** URL http(s) atau data: (demo lokal). */
  photo_url: z.string().min(1).max(600_000).optional(),
  created_at: z.string().datetime(),
})

export type HotspotReport = z.infer<typeof hotspotReportSchema>

export type HotspotReportInput = {
  lat: number
  lon: number
  region_code?: string
  hotspot_time?: string
  sighting: HotspotSighting
  author_name: string
  description?: string
  photo_url?: string
}

/** Titik yang dibuka di sheet laporan. */
export type HotspotReportTarget = {
  lat: number
  lon: number
  region_code?: string
  hotspot_time?: string
}

type Listener = () => void

/** shortcut: localStorage demo only — ganti API saat BE siap. */
const STORAGE_KEY = 'pantau-mala:hotspot-reports-demo-v2'

function loadReports(): HotspotReport[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = z.array(hotspotReportSchema).safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : []
  } catch {
    return []
  }
}

function saveReports(next: HotspotReport[]) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // quota / private mode — tetap pakai memory
  }
}

let reports: HotspotReport[] = loadReports()
const listeners = new Set<Listener>()
const demoSeeded = new Set<string>()

function emit() {
  saveReports(reports)
  for (const fn of listeners) fn()
}

export function subscribeHotspotReports(fn: Listener): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export function getHotspotReportsSnapshot(): HotspotReport[] {
  return reports
}

export function getReportById(id: string): HotspotReport | undefined {
  return reports.find((r) => r.id === id)
}

const DEMO_PHOTOS = [
  'https://picsum.photos/seed/pantau-asap/480/320',
  'https://picsum.photos/seed/pantau-api/480/320',
  'https://picsum.photos/seed/pantau-kabut/480/320',
] as const

/** Seed laporan dummy sekali per titik (hanya FE demo). */
export function ensureDemoReports(lat: number, lon: number, regionCode?: string) {
  const key = pointKey(lat, lon)
  if (demoSeeded.has(key)) return
  demoSeeded.add(key)
  if (listReportsAt(lat, lon).length > 0) return
  const now = Date.now()
  const [pointLat, pointLon] = key.split(',').map(Number) as [number, number]
  const base = { lat, lon, point_lat: pointLat, point_lon: pointLon, region_code: regionCode }
  reports = [
    ...reports,
    {
      ...base,
      id: crypto.randomUUID(),
      sighting: 'asap',
      author_name: 'Sari Wulandari',
      description:
        'Asap tebal ke arah utara, kelihatan dari jalan desa. Bau hangus cukup kuat.',
      photo_url: DEMO_PHOTOS[0],
      created_at: new Date(now - 3600_000).toISOString(),
    },
    {
      ...base,
      id: crypto.randomUUID(),
      sighting: 'api_terlihat',
      author_name: 'Budi Hartono',
      description: 'Api kecil di tepi lahan. Sudah ada warga yang coba padamkan.',
      photo_url: DEMO_PHOTOS[1],
      created_at: new Date(now - 5 * 3600_000).toISOString(),
    },
    {
      ...base,
      id: crypto.randomUUID(),
      sighting: 'tidak_yakin',
      author_name: 'Rina Kusuma',
      description: 'Kabut atau asap? Dari jauh belum jelas, tapi langitnya gelap.',
      photo_url: DEMO_PHOTOS[2],
      created_at: new Date(now - 26 * 3600_000).toISOString(),
    },
  ]
  emit()
}

export function listReportsAt(lat: number, lon: number): HotspotReport[] {
  const key = pointKey(lat, lon)
  return reports
    .filter((r) => pointKey(r.point_lat, r.point_lon) === key)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export function listReportsForRegion(regionCode: string): HotspotReport[] {
  return reports
    .filter((r) => r.region_code === regionCode)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export function countAt(lat: number, lon: number): number {
  return listReportsAt(lat, lon).length
}

export function addHotspotReport(input: HotspotReportInput): HotspotReport {
  const sighting = hotspotSightingSchema.parse(input.sighting)
  const author = input.author_name.trim().slice(0, 80)
  if (!author) throw new Error('author_name required')
  const description = (input.description ?? '').trim().slice(0, 500)
  const key = pointKey(input.lat, input.lon)
  const [pointLat, pointLon] = key.split(',').map(Number) as [number, number]
  const report: HotspotReport = hotspotReportSchema.parse({
    id: crypto.randomUUID(),
    lat: input.lat,
    lon: input.lon,
    point_lat: pointLat,
    point_lon: pointLon,
    region_code: input.region_code?.trim() || undefined,
    hotspot_time: input.hotspot_time,
    sighting,
    author_name: author,
    description: description || undefined,
    photo_url: input.photo_url?.trim() || undefined,
    created_at: new Date().toISOString(),
  })
  reports = [report, ...reports]
  emit()
  return report
}

/** Baca foto lokal ke data URL (demo). Max ~180KB. */
export function readPhotoAsDataUrl(file: File): Promise<string | null> {
  if (!file.type.startsWith('image/')) return Promise.resolve(null)
  if (file.size > 180_000) return Promise.resolve(null)
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null
      resolve(result && result.length < 600_000 ? result : null)
    }
    reader.onerror = () => resolve(null)
    reader.readAsDataURL(file)
  })
}

/** Test-only. */
export function resetHotspotReportsForTests() {
  reports = []
  demoSeeded.clear()
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem('pantau-mala:hotspot-reports-demo')
  }
  for (const fn of listeners) fn()
}
