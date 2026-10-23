import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react'

import { Toast } from '@/components/common/toast'
import { StatusAnnouncer } from '@/components/common/status-announcer'
import { focusRing } from '@/components/common/focus-ring'
import { FilterBar } from '@/components/map/filter-bar'
import { LocationDetailSync } from '@/components/map/location-detail-sync'
import { LocationPromptDialog } from '@/components/map/location-prompt-dialog'
import { MapControls } from '@/components/map/map-controls'
import { MapLegend } from '@/components/map/map-legend'
import { PanelFooter } from '@/components/panel/panel-footer'
import { SummaryPanel } from '@/components/panel/summary-panel'
import { WilayahUrlSync } from '@/components/wilayah-url-sync'
import type { MapRef } from '@/components/ui/map'
import { TooltipProvider } from '@/components/ui/tooltip'
import { getCopy, useLocaleStore } from '@/copy'
import { useRegions } from '@/data/queries'
import { filterRegions } from '@/lib/filter-regions'
import { restoreFocusTrigger } from '@/lib/focus-return'
import { locationFromCoords } from '@/lib/geolocation'
import {
  BREAKPOINT,
  isMobileWidth,
  sheetCycleNext,
  sheetSnapFromDrag,
} from '@/lib/layout'
import { mapOverlayGestureProps } from '@/lib/stop-map-gesture'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

const MapShell = lazy(() =>
  import('@/components/map/map-shell').then((m) => ({ default: m.MapShell })),
)

const easePanel = 'duration-300 ease-out-soft'

export default function App() {
  // Subscribe locale: changing language re-renders the whole tree (children read via getCopy()).
  useLocaleStore((s) => s.locale)
  const mapRef = useRef<MapRef | null>(null)
  const panelContentRef = useRef<HTMLDivElement>(null)
  const locationNudgedRef = useRef(false)
  const sheetDragYRef = useRef<number | null>(null)
  const [mobile, setMobile] = useState(() => isMobileWidth())
  const panelOpen = useUiStore((s) => s.panelOpen)
  const mobileSheet = useUiStore((s) => s.mobileSheet)
  const togglePanel = useUiStore((s) => s.togglePanel)
  const setMobileSheet = useUiStore((s) => s.setMobileSheet)
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${BREAKPOINT.sm - 1}px)`)
    const onChange = () => {
      setMobile(mq.matches)
      // Masuk mobile: setengah layar (pola Maps 50/50).
      if (mq.matches) setMobileSheet('half')
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [setMobileSheet])

  // Coerce sisa state "full" lama → half.
  useEffect(() => {
    if (mobileSheet === 'full') setMobileSheet('half')
  }, [mobileSheet, setMobileSheet])

  function onSheetHandlePointerDown(e: ReactPointerEvent<HTMLButtonElement>) {
    if (!mobile) return
    sheetDragYRef.current = e.clientY
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function onSheetHandlePointerUp(e: ReactPointerEvent<HTMLButtonElement>) {
    if (!mobile || sheetDragYRef.current == null) return
    const dy = e.clientY - sheetDragYRef.current
    sheetDragYRef.current = null
    // Ketuk / geser: hanya peek ↔ half (50/50).
    if (Math.abs(dy) < 8) {
      setMobileSheet(sheetCycleNext(mobileSheet))
      return
    }
    setMobileSheet(sheetSnapFromDrag(dy, mobileSheet))
  }

  const sheetHeightVar =
    mobileSheet === 'peek' ? 'var(--map-sheet-peek)' : 'var(--map-sheet-half)'

  const sheetHandleLabel =
    mobileSheet === 'peek' ? getCopy().app.expandSheet : getCopy().app.sheetHalf

  const { data, isPending, isError, refetch } = useRegions()
  const province = useMapStore((s) => s.province)
  const selectedCategories = useMapStore((s) => s.selectedCategories)
  const query = useMapStore((s) => s.query)
  const selectedCode = useMapStore((s) => s.selectedCode)
  const select = useMapStore((s) => s.select)
  const setLocation = useMapStore((s) => s.setLocation)
  const locationStatus = useMapStore((s) => s.location.status)
  const wilayahNotFound = useMapStore((s) => s.wilayahNotFound)
  const setWilayahNotFound = useMapStore((s) => s.setWilayahNotFound)

  useEffect(() => {
    let cancelled = false
    if (!navigator.permissions?.query || !('geolocation' in navigator)) return
    void navigator.permissions.query({ name: 'geolocation' }).then((permission) => {
      if (cancelled || permission.state !== 'granted') return
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (cancelled) return
          setLocation(
            locationFromCoords(position.coords.latitude, position.coords.longitude),
          )
        },
        () => {},
        { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
      )
    })
    return () => {
      cancelled = true
    }
  }, [setLocation])

  // Mobile: dorong lokasi sekali (Maps-style) — dialog, bukan hard-block.
  useEffect(() => {
    if (!mobile || locationNudgedRef.current) return
    if (locationStatus !== 'off') return
    if (!('geolocation' in navigator)) return
    locationNudgedRef.current = true
    const timer = window.setTimeout(() => {
      if (useMapStore.getState().location.status === 'off') {
        setLocation({ status: 'requesting' })
      }
    }, 700)
    return () => window.clearTimeout(timer)
  }, [mobile, locationStatus, setLocation])

  useEffect(() => {
    const el = panelContentRef.current
    if (el) el.scrollTop = 0
  }, [selectedCode, province, query, selectedCategories, mobileSheet])

  // Provinsi / detail dari peek: naik ke half supaya judul + isi terbaca.
  useEffect(() => {
    if (!mobile || mobileSheet !== 'peek') return
    if (selectedCode || province !== 'Semua') setMobileSheet('half')
  }, [mobile, selectedCode, province, mobileSheet, setMobileSheet])

  useEffect(() => {
    if (selectedCode && data) {
      const region = data.find((r) => r.code === selectedCode)
      if (region && province !== region.province) {
        useMapStore.getState().setProvince(region.province)
      }
    }
  }, [selectedCode, data, province])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      if (locationStatus === 'requesting') {
        setLocation({ status: 'off' })
        restoreFocusTrigger()
        return
      }
      // Bertingkat: detail wilayah → panel provinsi → beranda (search tersedia).
      if (wilayahNotFound) {
        setWilayahNotFound(false)
        if (window.location.pathname !== '/') {
          window.history.pushState(null, '', '/')
        }
        restoreFocusTrigger()
        return
      }
      if (selectedCode) {
        select(null)
        restoreFocusTrigger()
        return
      }
      if (province !== 'Semua') {
        useMapStore.getState().setProvince('Semua')
        restoreFocusTrigger()
        return
      }
      if (query.trim()) {
        useMapStore.getState().setQuery('')
        restoreFocusTrigger()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    locationStatus,
    wilayahNotFound,
    selectedCode,
    province,
    query,
    select,
    setLocation,
    setWilayahNotFound,
  ])

  const filtered = useMemo(
    () => (data ? filterRegions(data, { province, selectedCategories, query }) : []),
    [data, province, selectedCategories, query],
  )

  // Peta ikut filter kategori/provinsi; query hanya mempersempit daftar panel.
  const mapRegions = useMemo(
    () => (data ? filterRegions(data, { province, selectedCategories, query: '' }) : []),
    [data, province, selectedCategories],
  )

  return (
    <TooltipProvider>
      <div
        className="bg-map-bg text-ink relative h-dvh w-dvw overflow-hidden"
        style={
          mobile
            ? ({
                ['--map-sheet-current' as string]: sheetHeightVar,
              } as CSSProperties)
            : undefined
        }
      >
        <WilayahUrlSync />
        <StatusAnnouncer />
        <Toast />

        <aside
          aria-label={getCopy().app.panelAria}
          // Desktop/tablet: inert saat tertutup. Mobile: sheet selalu interaktif.
          inert={(!mobile && !panelOpen) || undefined}
          className={cn(
            'absolute z-40 flex flex-col overflow-hidden',
            'border-line bg-surface shadow-chrome border',
            easePanel,
            'transition-[transform,opacity,height]',
            // Mobile: peek ↔ half ↔ full. Tablet+: panel kiri.
            // Mobile: tinggi ketat peek/half — jangan ikut konten (meluap menutup peta).
            'rounded-t-panel inset-x-0 bottom-0 h-(--map-sheet-current) max-h-(--map-sheet-current) translate-y-0 border-b-0 opacity-100',
            'sm:inset-auto sm:top-(--floating-control-offset) sm:right-auto sm:bottom-(--floating-control-offset) sm:left-(--floating-control-offset)',
            'sm:rounded-panel sm:h-auto sm:max-h-none sm:w-[min(var(--map-panel-width),calc(100vw-5rem))] sm:border',
            !panelOpen &&
              'sm:pointer-events-none sm:-translate-x-(--map-overlay-inset) sm:opacity-0',
          )}
          aria-hidden={!mobile && !panelOpen}
          {...mapOverlayGestureProps}
        >
          <button
            type="button"
            className={cn(
              'flex w-full shrink-0 touch-none flex-col items-center pt-2 pb-1 sm:hidden',
              focusRing,
            )}
            aria-expanded={mobileSheet !== 'peek'}
            aria-label={sheetHandleLabel}
            onPointerDown={onSheetHandlePointerDown}
            onPointerUp={onSheetHandlePointerUp}
            onPointerCancel={() => {
              sheetDragYRef.current = null
            }}
          >
            <span className="bg-ink-3 h-1 w-10 rounded-full" aria-hidden />
          </button>
          <div
            ref={panelContentRef}
            className={cn(
              'min-h-0 flex-1 overscroll-contain',
              mobile && mobileSheet === 'peek'
                ? 'overflow-hidden'
                : 'soft-scroll overflow-y-auto',
            )}
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
          {/* Peek: sembunyikan footer agar Brand / judul detail yang terlihat. */}
          {!(mobile && mobileSheet === 'peek') ? <PanelFooter /> : null}
        </aside>

        {/* Tablet/desktop: tab di tepi panel. */}
        <button
          type="button"
          onClick={togglePanel}
          aria-expanded={panelOpen}
          aria-label={panelOpen ? getCopy().app.hidePanel : getCopy().app.showPanel}
          className={cn(
            'absolute top-1/2 z-[41] hidden h-12 w-11 -translate-y-1/2 items-center justify-center sm:flex',
            'rounded-r-ctl border-line bg-surface text-ink-2 shadow-chrome border border-l-0',
            'hover:bg-surface-muted',
            easePanel,
            'transition-[left,background-color] duration-150',
            focusRing,
            panelOpen ? 'left-[min(var(--map-panel-edge),calc(100vw-4rem))]' : 'left-0',
          )}
          {...mapOverlayGestureProps}
        >
          {panelOpen ? (
            <ChevronLeft className="size-3.5" strokeWidth={1.75} aria-hidden />
          ) : (
            <ChevronRight className="size-3.5" strokeWidth={1.75} aria-hidden />
          )}
        </button>

        {data ? <FilterBar panelOpen={panelOpen} regions={data} /> : null}

        <LocationDetailSync mapRef={mapRef} />
        <LocationPromptDialog mapRef={mapRef} />
        {!isPending && <MapLegend />}
        {!isPending && <MapControls mapRef={mapRef} />}

        <main
          aria-label={getCopy().app.mapAria}
          // Mobile: canvas peta = area di atas sheet (kecil saat half) — bukan full-bleed di balik sheet.
          className={cn(
            'absolute inset-x-0 top-0 z-0',
            'bottom-(--map-sheet-current) sm:bottom-0',
            'ease-out-soft transition-[bottom] duration-300',
          )}
        >
          {/* Suspense: bg polos. Overlay "Memuat…" di AccessGate sampai mapReady. */}
          <Suspense fallback={<div className="bg-map-bg size-full" aria-hidden />}>
            <MapShell
              mapRef={mapRef}
              panelOpen={panelOpen}
              regions={isPending ? [] : mapRegions}
              dataReady={!isPending}
            />
          </Suspense>
        </main>
      </div>
    </TooltipProvider>
  )
}
