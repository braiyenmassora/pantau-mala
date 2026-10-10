/**
 * Perkiraan area titik panas — client-side fallback when
 * /data/area-titik-panas.geojson is absent.
 *
 * PostGIS padanan (worker):
 *   ST_ClusterDBSCAN(geom, eps := 2000, minpoints := 3)
 *   lalu ST_Union(ST_Buffer(geom::geography, 375))
 *   (eps 2000 m, buffer VIIRS ~375 m).
 */
import area from '@turf/area'
import buffer from '@turf/buffer'
import clustersDbscan from '@turf/clusters-dbscan'
import { featureCollection } from '@turf/helpers'
import simplify from '@turf/simplify'
import union from '@turf/union'
import type { Feature, FeatureCollection, Polygon, MultiPolygon } from 'geojson'

import type {
  HotspotFeature,
  HotspotFeatureCollection,
  Region,
  RiskCategory,
} from '@/data/types'

export type HotspotAreaProperties = {
  id: string
  jumlah_titik: number
  /** km², 1 decimal */
  luas_km2: number
  waktu_terakhir: string
  kode_wilayah: string
  kategori: RiskCategory
}

export type HotspotAreaFeature = Feature<
  Polygon | MultiPolygon,
  HotspotAreaProperties
>

export type HotspotAreaFeatureCollection = FeatureCollection<
  Polygon | MultiPolygon,
  HotspotAreaProperties
>

const MAX_DISTANCE_KM = 2
const MIN_POINTS = 3
/** VIIRS pixel half-width ≈ 375 m. */
const BUFFER_KM = 0.375
const SIMPLIFY_TOLERANCE = 0.00015

function majorityKode(points: HotspotFeature[]): string {
  const counts = new Map<string, number>()
  for (const p of points) {
    const k = p.properties.kode_wilayah
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  let best = points[0]!.properties.kode_wilayah
  let bestN = 0
  for (const [k, n] of counts) {
    if (n > bestN) {
      best = k
      bestN = n
    }
  }
  return best
}

function latestWaktu(points: HotspotFeature[]): string {
  return points.reduce((a, b) =>
    a.properties.waktu >= b.properties.waktu ? a : b,
  ).properties.waktu
}

function clusterPolygon(
  points: HotspotFeature[],
): Feature<Polygon | MultiPolygon> | null {
  const buffers = points
    .map((p) => buffer(p, BUFFER_KM, { units: 'kilometers' }))
    .filter((b): b is NonNullable<typeof b> => b != null)
  if (buffers.length === 0) return null

  let merged: Feature<Polygon | MultiPolygon> | null =
    buffers.length === 1
      ? (buffers[0] as Feature<Polygon | MultiPolygon>)
      : (union(featureCollection(buffers)) as Feature<
          Polygon | MultiPolygon
        > | null)

  if (!merged) return null

  try {
    merged = simplify(merged, {
      tolerance: SIMPLIFY_TOLERANCE,
      highQuality: true,
      mutate: false,
    }) as Feature<Polygon | MultiPolygon>
  } catch {
    // keep unsimplified if simplify fails on edge geometry
  }
  return merged
}

/**
 * Cluster nearby hotspots (sedang/tinggi only) into estimated area polygons.
 * Noise / clusters with &lt; minPoints yield no polygon.
 */
export function computeHotspotAreas(
  features: HotspotFeatureCollection | HotspotFeature[],
  wilayah: Region[],
): HotspotAreaFeatureCollection {
  const list = Array.isArray(features) ? features : features.features
  const byKode = new Map(wilayah.map((r) => [r.kode, r]))

  const usable = list.filter(
    (f) =>
      f.properties.keyakinan === 'sedang' || f.properties.keyakinan === 'tinggi',
  )
  if (usable.length < MIN_POINTS) {
    return featureCollection([])
  }

  const clustered = clustersDbscan(featureCollection(usable), MAX_DISTANCE_KM, {
    units: 'kilometers',
    minPoints: MIN_POINTS,
  })

  const groups = new Map<number, HotspotFeature[]>()
  for (const f of clustered.features) {
    const id = f.properties?.cluster
    if (id == null || id < 0) continue
    const arr = groups.get(id) ?? []
    arr.push(f as HotspotFeature)
    groups.set(id, arr)
  }

  const out: HotspotAreaFeature[] = []
  for (const [clusterId, points] of groups) {
    if (points.length < MIN_POINTS) continue
    const geom = clusterPolygon(points)
    if (!geom) continue

    const kode = majorityKode(points)
    const region = byKode.get(kode)
    const kategori: RiskCategory = region?.kategori ?? 'rendah'
    const m2 = area(geom)
    const luas_km2 = Math.round((m2 / 1_000_000) * 10) / 10

    out.push({
      type: 'Feature',
      geometry: geom.geometry,
      properties: {
        id: `area-${clusterId}`,
        jumlah_titik: points.length,
        luas_km2,
        waktu_terakhir: latestWaktu(points),
        kode_wilayah: kode,
        kategori,
      },
    })
  }

  return featureCollection(out)
}
