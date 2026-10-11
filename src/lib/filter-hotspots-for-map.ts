import type { Feature, FeatureCollection, Point } from 'geojson'

import type { HotspotFeatureCollection, Region, RiskCategory } from '@/data/types'
import { RISK_CATEGORIES } from '@/lib/risk-category'

export type MapHotspotProps = {
  time: string
  satellite: string
  confidence: string
  frp_mw: number
  region_code?: string
  /** 0–1 bobot heatmap dari risk kab. */
  weight: number
  color: string
}

const RISK_WEIGHT: Record<RiskCategory, number> = {
  sangat_tinggi: 1,
  sedang: 0.55,
  rendah: 0.2,
}

/** Titik untuk layer zoom (heatmap / cluster) — kosong di overview nasional. */
export function filterHotspotsForMap(
  data: HotspotFeatureCollection | undefined,
  regions: Region[],
  province: string,
  selectedCode: string | null,
): FeatureCollection<Point, MapHotspotProps> {
  const empty: FeatureCollection<Point, MapHotspotProps> = {
    type: 'FeatureCollection',
    features: [],
  }
  if (!data) return empty
  if (province === 'Semua' && !selectedCode) return empty

  const regionByCode = new Map(regions.map((r) => [r.code, r]))
  const codes = new Set(regions.map((r) => r.code))
  const features: Feature<Point, MapHotspotProps>[] = []

  for (const f of data.features) {
    const code = f.properties.region_code
    if (!code || !codes.has(code)) continue
    if (selectedCode) {
      if (code !== selectedCode) continue
    } else if (province === 'Semua') {
      continue
    }
    const c = f.properties.confidence
    if (c !== 'sedang' && c !== 'tinggi') continue
    const risk = regionByCode.get(code)?.risk_category ?? 'sedang'
    features.push({
      type: 'Feature',
      geometry: f.geometry,
      properties: {
        time: f.properties.time,
        satellite: f.properties.satellite,
        confidence: f.properties.confidence,
        frp_mw: f.properties.frp_mw,
        region_code: code,
        weight: RISK_WEIGHT[risk],
        color: RISK_CATEGORIES[risk].dot,
      },
    })
  }

  return { type: 'FeatureCollection', features }
}
