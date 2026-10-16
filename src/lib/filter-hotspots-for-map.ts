import type { Feature, FeatureCollection, Point } from 'geojson'

import type { HotspotFeatureCollection, Region } from '@/data/types'
import { normalizeProvinceName } from '@/lib/province-boundaries'
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
  risk_rank: number
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

  const regionsByCode = new Map(regions.map((region) => [region.code, region]))
  const features: Feature<Point, MapHotspotProps>[] = []

  for (const f of data.features) {
    const code = f.properties.region_code
    const region = code ? regionsByCode.get(code) : undefined
    if (!region) continue
    if (
      _province !== 'Semua' &&
      normalizeProvinceName(region.province) !== normalizeProvinceName(_province)
    ) {
      continue
    }
    if (selectedCode) {
      if (code !== selectedCode) continue
    }
    const c = f.properties.confidence
    const visual =
      c === 'tinggi'
        ? { weight: 1, category: 'sangat_tinggi' as const }
        : c === 'sedang'
          ? { weight: 0.55, category: 'sedang' as const }
          : { weight: 0.2, category: 'rendah' as const }
    features.push({
      type: 'Feature',
      geometry: f.geometry,
      properties: {
        time: f.properties.time,
        satellite: f.properties.satellite,
        confidence: f.properties.confidence,
        frp_mw: f.properties.frp_mw,
        region_code: code,
        weight: visual.weight,
        color: RISK_CATEGORIES[visual.category].dot,
        risk_rank:
          region.risk_category === 'sangat_tinggi'
            ? 3
            : region.risk_category === 'sedang'
              ? 2
              : region.risk_category === 'rendah'
                ? 1
                : 0,
      },
    })
  }

  return { type: 'FeatureCollection', features }
}
