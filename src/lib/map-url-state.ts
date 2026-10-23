import type { ReportHotspot } from '@/store/map'

const REGION_PATH = '/wilayah/'

export type SharedMapState = {
  regionCode: string | null
  hotspot: ReportHotspot | null
  earthquakeTime: string | null
}

function coordinate(value: string | null, min: number, max: number) {
  if (value === null || value.trim() === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : null
}

function regionCodeFromPath(pathname: string) {
  if (!pathname.startsWith(REGION_PATH)) return null
  const encoded = pathname.slice(REGION_PATH.length).split('/')[0]
  if (!encoded) return null
  try {
    const code = decodeURIComponent(encoded).trim()
    return /^[A-Za-z0-9._-]{1,80}$/.test(code) ? code : null
  } catch {
    return null
  }
}

export function readSharedMapState(location: Pick<Location, 'pathname' | 'search'>): SharedMapState {
  if (location.pathname.startsWith('/gempa/')) {
    const encoded = location.pathname.slice('/gempa/'.length).split('/')[0]
    try {
      const time = decodeURIComponent(encoded)
      return {
        regionCode: null,
        hotspot: null,
        earthquakeTime: Number.isNaN(Date.parse(time)) ? null : time,
      }
    } catch {
      return { regionCode: null, hotspot: null, earthquakeTime: null }
    }
  }
  const regionCode = regionCodeFromPath(location.pathname)
  const params = new URLSearchParams(location.search)
  const lat = coordinate(params.get('lat'), -90, 90)
  const lon = coordinate(params.get('lon'), -180, 180)
  const time = params.get('at')
  const satellite = params.get('sat')
  const frpMw = Number(params.get('frp'))
  const hasValidHotspot =
    regionCode !== null &&
    lat !== null &&
    lon !== null &&
    typeof time === 'string' &&
    !Number.isNaN(Date.parse(time)) &&
    typeof satellite === 'string' &&
    satellite.length > 0 &&
    satellite.length <= 80 &&
    Number.isFinite(frpMw)

  return {
    regionCode,
    hotspot: hasValidHotspot
      ? { lat, lon, time, satellite, frpMw }
      : null,
    earthquakeTime: null,
  }
}

export function sharedMapPath(state: SharedMapState) {
  if (state.earthquakeTime) return `/gempa/${encodeURIComponent(state.earthquakeTime)}`
  if (!state.regionCode) return '/'
  const path = `${REGION_PATH}${encodeURIComponent(state.regionCode)}`
  if (!state.hotspot) return path

  const params = new URLSearchParams({
    lat: state.hotspot.lat.toFixed(5),
    lon: state.hotspot.lon.toFixed(5),
    at: state.hotspot.time,
    frp: String(state.hotspot.frpMw),
    sat: state.hotspot.satellite,
  })
  return `${path}?${params.toString()}`
}
