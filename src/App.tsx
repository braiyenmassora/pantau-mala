import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'

import { focusRing } from '@/components/common/focus-ring'
import { FilterBar } from '@/components/map/filter-bar'
import { LocationPromptDialog } from '@/components/map/location-prompt-dialog'
import { IndonesiaMapFraming } from '@/components/map/indonesia-map-framing'
import { MapControls } from '@/components/map/map-controls'
import { MapLegend } from '@/components/map/map-legend'
import { RegionLayers } from '@/components/map/region-layers'
import { UpdatedAtBadge } from '@/components/map/updated-at'
import { UserLocationLayer } from '@/components/map/user-location-layer'
import { SearchBox } from '@/components/panel/search-box'
import { SummaryPanel } from '@/components/panel/summary-panel'
import { Map, type MapRef } from '@/components/ui/map'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useRegions } from '@/data/queries'
import { filterRegions } from '@/lib/filter-regions'
import { INDONESIA_CENTER, MAP_MAX_BOUNDS } from '@/lib/indonesia-view'
import { mapOverlayGestureProps } from '@/lib/stop-map-gesture'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

const easePanel = 'duration-300 ease-[var(--ease-out-soft)]'

export default function App() {
  const mapRef = useRef<MapRef | null>(null)
  const panelContentRef = useRef<HTMLDivElement>(null)
  const panelOpen = useUiStore((s) => s.panelOpen)
  const togglePanel = useUiStore((s) => s.togglePanel)

  const { data, isPending, isError } = useRegions()
  const province = useMapStore((s) => s.province)
  const selectedCategories = useMapStore((s) => s.selectedCategories)
  const query = useMapStore((s) => s.query)
  const selectedCode = useMapStore((s) => s.selectedCode)

  useEffect(() => {
    const el = panelContentRef.current
    if (el) el.scrollTop = 0
  }, [selectedCode, province, query])

  const filtered = useMemo(
    () =>
      data ? filterRegions(data, { province, selectedCategories, query }) : [],
    [data, province, selectedCategories, query],
  )

  return (
    <TooltipProvider>
      <div className="relative h-dvh w-dvw overflow-hidden bg-map-bg text-ink">
        <div className="absolute inset-0 z-0">
          <Map
            ref={mapRef}
            theme="light"
            className="size-full"
            center={INDONESIA_CENTER}
            zoom={4.5}
            maxBounds={MAP_MAX_BOUNDS}
            attributionControl={false}
            dragRotate={false}
            pitchWithRotate={false}
          >
            <IndonesiaMapFraming panelOpen={panelOpen} />
            <RegionLayers regions={filtered} />
            <UserLocationLayer />
          </Map>
        </div>

        {data && <FilterBar panelOpen={panelOpen} regions={data} />}
        <LocationPromptDialog mapRef={mapRef} />

        <aside
          className={cn(
            'absolute top-4 bottom-4 left-4 z-40 flex w-[400px] flex-col overflow-hidden',
            'rounded-panel bg-surface shadow-md',
            easePanel,
            'transition-[transform,opacity]',
            panelOpen
              ? 'translate-x-0 opacity-100'
              : 'pointer-events-none -translate-x-[432px] opacity-0',
          )}
          aria-hidden={!panelOpen}
          {...mapOverlayGestureProps}
        >
          <div className="shrink-0 px-4 pt-4">
            <SearchBox mapRef={mapRef} />
          </div>

          <div
            ref={panelContentRef}
            className="soft-scroll soft-fade min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-5 pb-8"
          >
            <SummaryPanel
              regions={data ?? []}
              filtered={filtered}
              mapRef={mapRef}
              isPending={isPending}
              isError={isError}
            />
          </div>

          <footer className="shrink-0 border-t border-line px-4 py-3 text-xs leading-4 text-ink-2">
            Data: NASA FIRMS · BMKG · Open-Meteo
          </footer>
        </aside>

        <button
          type="button"
          onClick={togglePanel}
          aria-expanded={panelOpen}
          aria-label={panelOpen ? 'Sembunyikan panel' : 'Tampilkan panel'}
          className={cn(
            'absolute top-1/2 z-[41] flex h-12 w-6 -translate-y-1/2 items-center justify-center',
            'rounded-r-ctl border border-l-0 border-line bg-surface text-ink-2 shadow-sm',
            'hover:bg-surface-muted',
            easePanel,
            'transition-[left,background-color] duration-150',
            focusRing,
            panelOpen ? 'left-[416px]' : 'left-0',
          )}
          {...mapOverlayGestureProps}
        >
          {panelOpen ? (
            <ChevronLeft className="size-3.5" strokeWidth={2} aria-hidden />
          ) : (
            <ChevronRight className="size-3.5" strokeWidth={2} aria-hidden />
          )}
        </button>

        <MapLegend panelOpen={panelOpen} />
        <MapControls mapRef={mapRef} />
        <UpdatedAtBadge />
      </div>
    </TooltipProvider>
  )
}
