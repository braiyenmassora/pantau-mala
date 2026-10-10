import { Info } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { focusRing } from '@/components/common/focus-ring'
import { MapGeoJSON, MapPopup, useMap } from '@/components/ui/map'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useHotspotAreas, useRegions } from '@/data/queries'
import { copy } from '@/copy/id'
import { formatDateTime, formatNumber } from '@/lib/format'
import type { HotspotAreaProperties } from '@/lib/hotspot-areas'
import { RISK_CATEGORIES, withAlpha } from '@/lib/risk-category'
import { cn } from '@/lib/utils'

const AREA_MIN_ZOOM = 7

const FILL: Record<string, string> = {
  sangat_tinggi: withAlpha(RISK_CATEGORIES.sangat_tinggi.dot, 0.16),
  sedang: withAlpha(RISK_CATEGORIES.sedang.dot, 0.16),
  rendah: withAlpha(RISK_CATEGORIES.rendah.dot, 0.16),
}
const FILL_HOVER: Record<string, string> = {
  sangat_tinggi: withAlpha(RISK_CATEGORIES.sangat_tinggi.dot, 0.24),
  sedang: withAlpha(RISK_CATEGORIES.sedang.dot, 0.24),
  rendah: withAlpha(RISK_CATEGORIES.rendah.dot, 0.24),
}
const LINE: Record<string, string> = {
  sangat_tinggi: withAlpha(RISK_CATEGORIES.sangat_tinggi.dot, 0.7),
  sedang: withAlpha(RISK_CATEGORIES.sedang.dot, 0.7),
  rendah: withAlpha(RISK_CATEGORIES.rendah.dot, 0.7),
}

type SelectedArea = {
  props: HotspotAreaProperties
  lon: number
  lat: number
  zona: 'WIB' | 'WITA' | 'WIT'
}

/** Perkiraan area polygons — canvas layer under pins/halo (DOM). Zoom ≥ 7 only. */
export function HotspotAreasLayer() {
  const { map } = useMap()
  const { data } = useHotspotAreas()
  const { data: regions } = useRegions()
  const [zoom, setZoom] = useState(() => map?.getZoom() ?? 0)
  const [selected, setSelected] = useState<SelectedArea | null>(null)

  useEffect(() => {
    if (!map) return
    const sync = () => setZoom(map.getZoom())
    sync()
    map.on('zoomend', sync)
    map.on('moveend', sync)
    return () => {
      map.off('zoomend', sync)
      map.off('moveend', sync)
    }
  }, [map])

  useEffect(() => {
    if (!selected) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected])

  useEffect(() => {
    if (zoom < AREA_MIN_ZOOM) setSelected(null)
  }, [zoom])

  const byKode = useMemo(() => {
    const m = new Map<string, { zona: 'WIB' | 'WITA' | 'WIT' }>()
    for (const r of regions ?? []) {
      m.set(r.kode, { zona: r.zona_waktu })
    }
    return m
  }, [regions])

  const visible = zoom >= AREA_MIN_ZOOM && data && data.features.length > 0

  return (
    <>
      {visible && (
        <MapGeoJSON<HotspotAreaProperties>
          id="hotspot-areas"
          data={data}
          promoteId="id"
          interactive
          fillPaint={{
            'fill-color': [
              'match',
              ['get', 'kategori'],
              'sangat_tinggi',
              FILL.sangat_tinggi,
              'sedang',
              FILL.sedang,
              'rendah',
              FILL.rendah,
              FILL.rendah,
            ],
            'fill-opacity': 1,
          }}
          fillHoverPaint={{
            'fill-color': [
              'match',
              ['get', 'kategori'],
              'sangat_tinggi',
              FILL_HOVER.sangat_tinggi,
              'sedang',
              FILL_HOVER.sedang,
              'rendah',
              FILL_HOVER.rendah,
              FILL_HOVER.rendah,
            ],
          }}
          linePaint={{
            'line-color': [
              'match',
              ['get', 'kategori'],
              'sangat_tinggi',
              LINE.sangat_tinggi,
              'sedang',
              LINE.sedang,
              'rendah',
              LINE.rendah,
              LINE.rendah,
            ],
            'line-width': 1.5,
          }}
          onClick={(e) => {
            const props = e.feature.properties
            if (!props) return
            const meta = byKode.get(props.kode_wilayah)
            setSelected({
              props,
              lon: e.longitude,
              lat: e.latitude,
              zona: meta?.zona ?? 'WIB',
            })
          }}
        />
      )}

      {selected && (
        <MapPopup
          longitude={selected.lon}
          latitude={selected.lat}
          onClose={() => setSelected(null)}
          closeOnClick
          className="w-60 rounded-card border border-line bg-surface p-3 shadow-lg"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <p className="text-sm font-semibold text-ink">{copy.area.title}</p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      'text-ink-2 transition-colors hover:text-ink',
                      focusRing,
                      'rounded-ctl',
                    )}
                    aria-label={copy.area.hint}
                  >
                    <Info className="size-3.5" strokeWidth={2} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs rounded-ctl">
                  {copy.area.tooltip}
                </TooltipContent>
              </Tooltip>
            </div>
            <ul className="space-y-1 text-sm text-ink-2">
              <li>
                {copy.area.hotspotCount(
                  formatNumber(selected.props.jumlah_titik),
                )}
              </li>
              <li>
                {copy.area.approxArea(
                  formatNumber(selected.props.luas_km2, {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  }),
                )}
              </li>
              <li>
                {copy.area.lastDetected(
                  formatDateTime(selected.props.waktu_terakhir, selected.zona),
                )}
              </li>
            </ul>
          </div>
        </MapPopup>
      )}
    </>
  )
}
