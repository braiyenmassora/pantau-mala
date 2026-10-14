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
import { MapSourcesStrip } from '@/components/map/map-sources-strip'
import { PanelHeaderPill } from '@/components/panel/panel-header-pill'
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

const easePanel = 'duration-300 ease-out-soft'

export default function App() {
  const mapRef = useRef<MapRef | null>(null)
  const panelContentRef = useRef<HTMLDivElement>(null)
  const [mobile, setMobile] = useState(() => window.innerWidth < 640)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const sync = () => setMobile(mq.matches)
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  const panelOpen = useUiStore((s) => s.panelOpen)
  const togglePanel = useUiStore((s) => s.togglePanel)

  const { data, isPending, isError, refetch } = useRegions()
  const province = useMapStore((s) => s.province)
  const selectedCategories = useMapStore((s) => s.selectedCategories)
  const query = useMapStore((s) => s.query)
  const selectedCode = useMapStore((s) => s.selectedCode)
  const select = useMapStore((s) => s.select)
  const setLocation = useMapStore((s) => s.setLocation)
  const locationStatus = useMapStore((s) => s.location.status)

  useEffect(() => {
    let cancelled = false
    if (!navigator.permissions?.query || !('geolocation' in navigator)) return
    void navigator.permissions
      .query({ name: 'geolocation' })
      .then((permission) => {
        if (cancelled || permission.state !== 'granted') return
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (cancelled) return
            setLocation({
              status: 'active',
              coords: { lat: position.coords.latitude, lon: position.coords.longitude },
            })
          },
          () => {},
          { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
        )
      })
    return () => {
      cancelled = true
    }
  }, [setLocation])

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

        <aside
          aria-label={copy.app.panelAria}
          inert={!panelOpen || undefined}
          className={cn(
            'absolute top-4 bottom-4 left-4 z-40 flex w-[calc(100vw-32px)] flex-col overflow-hidden sm:w-[400px]',
            'rounded-panel bg-surface shadow-md',
            easePanel,
            'transition-[transform,opacity]',
            panelOpen ? 'opacity-100' : 'pointer-events-none -translate-x-108 opacity-0',
          )}
          aria-hidden={!panelOpen}
          {...mapOverlayGestureProps}
        >
          <div className="shrink-0 px-4 pt-4 pb-3">
            <PanelHeaderPill mapRef={mapRef} />
          </div>

          <div
            ref={panelContentRef}
            className="soft-scroll soft-fade min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-1 pb-8"
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
        </aside>

        <button
          type="button"
          onClick={togglePanel}
          aria-expanded={panelOpen}
          aria-label={panelOpen ? copy.app.hidePanel : copy.app.showPanel}
          className={cn(
            'absolute top-1/2 z-41 flex h-12 w-6 -translate-y-1/2 items-center justify-center',
            'rounded-r-ctl border-line bg-surface text-ink-2 border border-l-0 shadow-sm',
            'hover:bg-surface-muted',
            easePanel,
            'transition-[left,background-color] duration-150',
            focusRing,
            panelOpen ? 'left-[calc(100vw-24px)] sm:left-104' : 'left-0',
          )}
          {...mapOverlayGestureProps}
        >
          {panelOpen ? (
            <ChevronLeft className="size-3.5" strokeWidth={2} aria-hidden />
          ) : (
            <ChevronRight className="size-3.5" strokeWidth={2} aria-hidden />
          )}
        </button>

        {data ? <FilterBar panelOpen={panelOpen} regions={data} /> : null}

        <LocationDetailSync mapRef={mapRef} />
        <LocationPromptDialog mapRef={mapRef} />
        {!isPending && (
          <>
            <MapLegend panelOpen={panelOpen} />
            <MapControls mapRef={mapRef} />
            <MapSourcesStrip />
          </>
        )}

        <main
          inert={(mobile && panelOpen) || undefined}
          aria-hidden={(mobile && panelOpen) || undefined}
          aria-label={copy.app.mapAria}
          className="absolute inset-0 z-0"
        >
          {/* Satu loader di MapShell sampai framing siap — jangan defer + SoftLoading ganda. */}
          <Suspense fallback={<MapSoftLoading />}>
            <MapShell
              mapRef={mapRef}
              panelOpen={panelOpen}
              regions={isPending ? [] : filtered}
            />
          </Suspense>
        </main>
      </div>
    </TooltipProvider>
  )
}
