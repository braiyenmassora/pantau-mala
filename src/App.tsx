import { ChevronLeft, ChevronRight } from 'lucide-react'
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'

import { StatusAnnouncer } from '@/components/common/status-announcer'
import { focusRing } from '@/components/common/focus-ring'
import { FilterBar } from '@/components/map/filter-bar'
import { LocationDetailSync } from '@/components/map/location-detail-sync'
import { LocationPromptDialog } from '@/components/map/location-prompt-dialog'
import { MapControls } from '@/components/map/map-controls'
import { MapLegend } from '@/components/map/map-legend'
import { MapSoftLoading } from '@/components/map/map-soft-loading'
import { UpdatedAtBadge } from '@/components/map/updated-at'
import { PanelFooter } from '@/components/panel/panel-footer'
import { SearchBox } from '@/components/panel/search-box'
import { SummaryPanel } from '@/components/panel/summary-panel'
import type { MapRef } from '@/components/ui/map'
import { TooltipProvider } from '@/components/ui/tooltip'
import { copy } from '@/copy/id'
import { useRegions } from '@/data/queries'
import { filterRegions } from '@/lib/filter-regions'
import { restoreFocusTrigger } from '@/lib/focus-return'
import { mapOverlayGestureProps } from '@/lib/stop-map-gesture'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

const MapShell = lazy(() =>
  import('@/components/map/map-shell').then((m) => ({ default: m.MapShell })),
)

const easePanel = 'duration-300 ease-[var(--ease-out-soft)]'

export default function App() {
  const mapRef = useRef<MapRef | null>(null)
  const panelContentRef = useRef<HTMLDivElement>(null)
  const [mapReady, setMapReady] = useState(false)
  const panelOpen = useUiStore((s) => s.panelOpen)
  const togglePanel = useUiStore((s) => s.togglePanel)

  // Defer MapLibre so panel paints first; keeps main-thread free for LCP/TBT.
  useEffect(() => {
    let cancelled = false
    const boot = () => {
      if (!cancelled) setMapReady(true)
    }
    const idle =
      typeof requestIdleCallback === 'function'
        ? requestIdleCallback(boot, { timeout: 2500 })
        : null
    const t = window.setTimeout(boot, 1800)
    return () => {
      cancelled = true
      if (idle != null) cancelIdleCallback(idle)
      clearTimeout(t)
    }
  }, [])

  const { data, isPending, isError, refetch } = useRegions()
  const province = useMapStore((s) => s.province)
  const selectedCategories = useMapStore((s) => s.selectedCategories)
  const query = useMapStore((s) => s.query)
  const selectedCode = useMapStore((s) => s.selectedCode)
  const select = useMapStore((s) => s.select)
  const setLocation = useMapStore((s) => s.setLocation)
  const locationStatus = useMapStore((s) => s.location.status)

  useEffect(() => {
    const el = panelContentRef.current
    if (el) el.scrollTop = 0
  }, [selectedCode, province, query, selectedCategories])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      if (locationStatus === 'requesting') {
        setLocation({ status: 'off' })
        restoreFocusTrigger()
        return
      }
      if (selectedCode) {
        select(null)
        restoreFocusTrigger()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [locationStatus, selectedCode, select, setLocation])

  const filtered = useMemo(
    () => (data ? filterRegions(data, { province, selectedCategories, query }) : []),
    [data, province, selectedCategories, query],
  )

  return (
    <TooltipProvider>
      <div className="bg-map-bg text-ink relative h-dvh w-dvw overflow-hidden">
        <StatusAnnouncer />

        {/* Tab order: search → chip → list → controls → pins (map last in DOM). */}
        <aside
          aria-label={copy.app.panelAria}
          inert={!panelOpen || undefined}
          className={cn(
            'absolute top-4 bottom-4 left-4 z-40 flex w-[400px] flex-col overflow-hidden',
            'rounded-panel bg-surface shadow-md',
            easePanel,
            'transition-[transform,opacity]',
            // Open without translate so fixed FilterBar inside isn't clipped by the aside.
            panelOpen
              ? 'opacity-100'
              : 'pointer-events-none -translate-x-[432px] opacity-0',
          )}
          aria-hidden={!panelOpen}
          {...mapOverlayGestureProps}
        >
          <header className="shrink-0 px-4 pt-4">
            <SearchBox mapRef={mapRef} />
          </header>

          {/* When panel open: chips sit between search and list in the tab order. */}
          {panelOpen && data && <FilterBar panelOpen={panelOpen} regions={data} />}

          <div
            ref={panelContentRef}
            className="soft-scroll soft-fade min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-8"
          >
            <SummaryPanel
              regions={data ?? []}
              filtered={filtered}
              mapRef={mapRef}
              isPending={isPending}
              isError={isError}
              onRetry={() => {
                void refetch()
              }}
            />
          </div>

          <PanelFooter />
        </aside>

        {/* Exception: panel rail chrome — not IconButton (narrow 24×48 tab). */}
        <button
          type="button"
          onClick={togglePanel}
          aria-expanded={panelOpen}
          aria-label={panelOpen ? copy.app.hidePanel : copy.app.showPanel}
          className={cn(
            'absolute top-1/2 z-[41] flex h-12 w-6 -translate-y-1/2 items-center justify-center',
            'rounded-r-ctl border-line bg-surface text-ink-2 border border-l-0 shadow-sm',
            'hover:bg-surface-muted',
            easePanel,
            'transition-[left,background-color] duration-150',
            focusRing,
            panelOpen ? 'left-[416px]' : 'left-0',
          )}
          {...mapOverlayGestureProps}
        >
          {panelOpen ? (
            <ChevronLeft className="size-4" strokeWidth={2} aria-hidden />
          ) : (
            <ChevronRight className="size-4" strokeWidth={2} aria-hidden />
          )}
        </button>

        {/* When panel closed: chips stay focusable outside inert aside. */}
        {!panelOpen && data && <FilterBar panelOpen={panelOpen} regions={data} />}

        <LocationDetailSync regions={data} />
        <LocationPromptDialog mapRef={mapRef} />
        <MapLegend panelOpen={panelOpen} />
        <MapControls mapRef={mapRef} />
        <UpdatedAtBadge />

        <main aria-label={copy.app.mapAria} className="absolute inset-0 z-0">
          {mapReady ? (
            <Suspense fallback={<MapSoftLoading />}>
              <MapShell mapRef={mapRef} panelOpen={panelOpen} regions={filtered} />
            </Suspense>
          ) : (
            <MapSoftLoading />
          )}
        </main>
      </div>
    </TooltipProvider>
  )
}
