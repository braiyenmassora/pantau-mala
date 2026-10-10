import { useEffect, useState, type RefObject } from 'react'

import type { MapRef } from '@/components/ui/map'
import { copy } from '@/copy/id'
import { AREA_MIN_ZOOM } from '@/lib/hotspot-areas'
import { RISK_CATEGORIES, withAlpha } from '@/lib/risk-category'
import { mapOverlayGestureProps } from '@/lib/stop-map-gesture'
import { cn } from '@/lib/utils'

type MapLegendProps = {
  panelOpen: boolean
  mapRef: RefObject<MapRef | null>
}

const ICON_BOX = 'flex size-9 shrink-0 items-center justify-center'

export function MapLegend({ panelOpen, mapRef }: MapLegendProps) {
  const high = RISK_CATEGORIES.sangat_tinggi.dot
  const mid = RISK_CATEGORIES.sedang.dot
  const low = RISK_CATEGORIES.rendah.dot
  const [zoom, setZoom] = useState(0)

  useEffect(() => {
    let off: (() => void) | undefined
    const attach = () => {
      const map = mapRef.current
      if (!map) return false
      const sync = () => setZoom(map.getZoom())
      sync()
      map.on('zoomend', sync)
      map.on('moveend', sync)
      off = () => {
        map.off('zoomend', sync)
        map.off('moveend', sync)
      }
      return true
    }
    if (attach()) return () => off?.()
    const id = window.setInterval(() => {
      if (attach()) window.clearInterval(id)
    }, 250)
    return () => {
      window.clearInterval(id)
      off?.()
    }
  }, [mapRef])

  const showArea = zoom >= AREA_MIN_ZOOM

  return (
    <div
      data-testid="map-legend"
      className={cn(
        'absolute bottom-4 z-30 flex flex-row flex-wrap items-stretch gap-2',
        'transition-[left,right] duration-300 ease-[var(--ease-out-soft)]',
        panelOpen ? 'left-[432px] right-[72px]' : 'left-4 w-max max-w-[calc(100vw-5rem)]',
      )}
      {...mapOverlayGestureProps}
    >
      <div className="flex items-center gap-2 rounded-card border border-line bg-surface px-3 py-2 shadow-sm">
        <span className={ICON_BOX} aria-hidden>
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: high }}
          />
        </span>
        <span className="flex flex-col gap-1">
          <span className="font-mono text-xs font-semibold text-ink">
            {copy.legend.scoreTitle}
          </span>
          <span className="text-xs text-ink-2">{copy.legend.scoreHint}</span>
        </span>
      </div>

      <div className="flex items-center gap-2 rounded-card border border-line bg-surface px-3 py-2 shadow-sm">
        <span className={`${ICON_BOX} gap-1`} aria-hidden>
          {[low, mid, high].map((dot) => (
            <span
              key={dot}
              className="size-2.5 rounded-full border"
              style={{
                backgroundColor: withAlpha(dot, 0.1),
                borderColor: withAlpha(dot, 0.24),
              }}
            />
          ))}
        </span>
        <span className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-ink">
            {copy.legend.haloTitle}
          </span>
          <span className="text-xs text-ink-2">{copy.legend.haloHint}</span>
        </span>
      </div>

      {showArea && (
        <div className="flex items-center gap-2 rounded-card border border-line bg-surface px-3 py-2 shadow-sm">
          <span className={ICON_BOX} aria-hidden>
            <span
              className="size-5 rounded-[2px] border-[1.5px]"
              style={{
                backgroundColor: withAlpha(high, 0.16),
                borderColor: withAlpha(high, 0.7),
              }}
            />
          </span>
          <span className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-ink">
              {copy.legend.areaTitle}
            </span>
            <span className="text-xs text-ink-2">{copy.legend.areaHint}</span>
          </span>
        </div>
      )}
    </div>
  )
}
