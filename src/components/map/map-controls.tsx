import { LocateFixed, Minus, Plus } from 'lucide-react'
import { type RefObject } from 'react'

import { focusRing } from '@/components/common/focus-ring'
import { MapAttributionLinks } from '@/components/map/map-attribution'
import type { MapRef } from '@/components/ui/map'
import { copy } from '@/copy/id'
import { useHotspots, useMeta, useRegions } from '@/data/queries'
import { getDataFreshness } from '@/lib/data-freshness'
import { rememberFocusTrigger } from '@/lib/focus-return'
import { formatRelativeAge } from '@/lib/format'
import { getMapPadding, LOCATION_ZOOM } from '@/lib/indonesia-view'
import { usePrefersReducedMotion } from '@/lib/prefers-reduced-motion'
import { resolveUserRegionCode } from '@/lib/resolve-user-region'
import { mapOverlayGestureProps } from '@/lib/stop-map-gesture'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

type MapControlsProps = {
  mapRef: RefObject<MapRef | null>
}

const iconClass = 'size-4 shrink-0'
const btnClass =
  'text-ink-2 hover:bg-surface-muted hover:text-ink flex size-11 shrink-0 items-center justify-center transition-[background-color,color] duration-150'

/** Kontrol peta + umur data + atribusi basemap di pojok bawah kanan. */
export function MapControls({ mapRef }: MapControlsProps) {
  const location = useMapStore((s) => s.location)
  const setLocation = useMapStore((s) => s.setLocation)
  const select = useMapStore((s) => s.select)
  const panelOpen = useUiStore((s) => s.panelOpen)
  const setPanelOpen = useUiStore((s) => s.setPanelOpen)
  const reducedMotion = usePrefersReducedMotion()
  const { data: regions } = useRegions()
  const { data: hotspots } = useHotspots()
  const { data: meta } = useMeta()
  const freshness = getDataFreshness(meta)
  const updatedIso =
    freshness.updatedAt ?? meta?.pulled_at.firms ?? meta?.pulled_at.weather
  const relative = updatedIso ? formatRelativeAge(updatedIso) : null
  const stampLabel = relative
    ? freshness.stale
      ? copy.updatedAt.staleStamp(relative)
      : copy.footer.dataUpdated(relative)
    : null
  const hasCoords =
    (location.status === 'active' || location.status === 'outside') && !!location.coords
  const inIndonesia = location.status === 'active' && !!location.coords

  return (
    <div
      data-testid="map-controls"
      className={cn(
        'absolute right-(--floating-control-offset) bottom-(--floating-control-offset) z-30 flex flex-col items-end gap-3 sm:gap-4',
        panelOpen && 'max-sm:hidden',
      )}
      {...mapOverlayGestureProps}
    >
      <div className="border-line bg-surface divide-line rounded-ctl shadow-chrome flex flex-col divide-y overflow-hidden border backdrop-blur-sm">
        <button
          type="button"
          className={cn(btnClass, hasCoords && 'bg-brand-soft text-brand', focusRing)}
          aria-label={hasCoords ? copy.map.recenter : copy.map.useMyLocation}
          aria-pressed={Boolean(hasCoords)}
          onClick={(e) => {
            if (hasCoords) {
              mapRef.current?.flyTo({
                center: [location.coords!.lon, location.coords!.lat],
                zoom: LOCATION_ZOOM,
                padding: getMapPadding(panelOpen),
                duration: reducedMotion ? 0 : 600,
              })
              if (inIndonesia && regions && hotspots) {
                const code = resolveUserRegionCode(
                  location.coords!,
                  regions,
                  hotspots.features,
                )
                if (code) {
                  select(code)
                  setPanelOpen(true)
                }
              } else {
                setPanelOpen(true)
              }
              return
            }
            rememberFocusTrigger(e.currentTarget)
            setLocation({ status: 'requesting' })
          }}
        >
          <LocateFixed className={iconClass} strokeWidth={2} aria-hidden />
        </button>

        <button
          type="button"
          className={cn(btnClass, focusRing)}
          aria-label={copy.map.zoomIn}
          onClick={() => mapRef.current?.zoomIn({ duration: 300 })}
        >
          <Plus className={iconClass} strokeWidth={2} aria-hidden />
        </button>
        <button
          type="button"
          className={cn(btnClass, focusRing)}
          aria-label={copy.map.zoomOut}
          onClick={() => mapRef.current?.zoomOut({ duration: 300 })}
        >
          <Minus className={iconClass} strokeWidth={2} aria-hidden />
        </button>
      </div>

      <div className="flex max-w-48 flex-col items-end gap-1 text-right">
        {stampLabel ? (
          <p
            data-testid="map-updated-stamp"
            role={freshness.stale ? 'alert' : 'status'}
            className={cn(
              'text-xs leading-4',
              freshness.stale
                ? 'bg-risk-mid-tint text-risk-mid-text rounded-ctl px-2 py-1 font-medium'
                : 'text-ink-2',
            )}
          >
            {stampLabel}
          </p>
        ) : null}
        <MapAttributionLinks />
      </div>
    </div>
  )
}
