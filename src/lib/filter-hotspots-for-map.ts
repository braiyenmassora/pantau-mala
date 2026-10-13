import type { Feature, FeatureCollection, Point } from 'geojson'

import type { HotspotFeatureCollection, Region } from '@/data/types'
import { RISK_CATEGORIES } from '@/lib/risk-category'

export type MapHotspotProps = {
  time: string
  satellite: string
  confidence: string
  frp_mw: number
  region_code?: string
  /** Relative satellite confidence weight, independent of stale/null risk scores. */
  weight: number
  color: string
}

/** Satellite observations follow the active region filter, including national overview. */
export function filterHotspotsForMap(
  data: HotspotFeatureCollection | undefined,
  regions: Region[],
  _province: string,
  selectedCode: string | null,
): FeatureCollection<Point, MapHotspotProps> {
  const empty: FeatureCollection<Point, MapHotspotProps> = {
    type: 'FeatureCollection',
    features: [],
  }
  if (!data) return empty

  const codes = new Set(regions.map((r) => r.code))
  const features: Feature<Point, MapHotspotProps>[] = []

  for (const f of data.features) {
    const code = f.properties.region_code
    if (!code || !codes.has(code)) continue
    if (selectedCode) {
      if (code !== selectedCode) continue
    }
    const c = f.properties.confidence
    if (c !== 'sedang' && c !== 'tinggi') continue
    features.push({
      type: 'Feature',
      geometry: f.geometry,
      properties: {
        time: f.properties.time,
        satellite: f.properties.satellite,
        confidence: f.properties.confidence,
        frp_mw: f.properties.frp_mw,
        region_code: code,
        weight: c === 'tinggi' ? 1 : 0.55,
        color: RISK_CATEGORIES[c === 'tinggi' ? 'sangat_tinggi' : 'sedang'].dot,
      },
    })
  }

  return { type: 'FeatureCollection', features }
}
