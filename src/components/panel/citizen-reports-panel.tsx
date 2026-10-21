import { X } from 'lucide-react'
import { useEffect, useMemo, useRef, type RefObject } from 'react'

import { focusRing } from '@/components/common/focus-ring'
import type { MapRef } from '@/components/ui/map'
import { copy } from '@/copy/id'
import {
  useReportCountsByRegion,
  type ReportRegionCount,
} from '@/data/hotspot-reports'
import { useRegionCatalog } from '@/data/queries'
import type { Region } from '@/data/types'
import { rememberFocusTrigger, restoreFocusTrigger } from '@/lib/focus-return'
import { formatNumber } from '@/lib/format'
import { getMapPadding, PLACE_ZOOM } from '@/lib/indonesia-view'
import { T } from '@/lib/pola'
import { usePrefersReducedMotion } from '@/lib/prefers-reduced-motion'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

type CitizenReportsPanelProps = {
  regions: Region[]
  mapRef: RefObject<MapRef | null>
}

type ProvinceGroup = {
  name: string
  total: number
  items: ReportRegionCount[]
}

/** Daftar laporan warga berkelompok provinsi › kab/kota; klik kab/kota membuka detail wilayahnya. */
export function CitizenReportsPanel({ regions, mapRef }: CitizenReportsPanelProps) {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const setReportsOpen = useUiStore((s) => s.setReportsOpen)
  const setPanelOpen = useUiStore((s) => s.setPanelOpen)
  const select = useMapStore((s) => s.select)
  const reducedMotion = usePrefersReducedMotion()
  const { data: counts = [], isPending } = useReportCountsByRegion()
  const { data: catalog } = useRegionCatalog()

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  const groups = useMemo<ProvinceGroup[]>(() => {
    const byProvince = new Map<string, ProvinceGroup>()
    for (const item of counts) {
      const province =
        catalog?.regencies.find((r) => r.code === item.region_code)?.province ??
        regions.find((r) => r.code === item.region_code)?.province ??
        'Wilayah lain'
      const group = byProvince.get(province) ?? { name: province, total: 0, items: [] }
      group.total += item.count
      group.items.push(item)
      byProvince.set(province, group)
    }
    return [...byProvince.values()].sort((a, b) => b.total - a.total)
  }, [counts, catalog, regions])

  const nameOf = (code: string) =>
    catalog?.regencies.find((r) => r.code === code)?.name ??
    regions.find((r) => r.code === code)?.name ??
    code

  const back = () => {
    setReportsOpen(false)
    restoreFocusTrigger()
  }

  const openRegion = (el: HTMLElement, item: ReportRegionCount) => {
    rememberFocusTrigger(el)
    const region = regions.find((r) => r.code === item.region_code)
    const cat = catalog?.regencies.find((r) => r.code === item.region_code)
    select(item.region_code, region?.province ?? cat?.province)
    setPanelOpen(true)
    const center = region?.center ?? cat?.center
    if (center) {
      mapRef.current?.flyTo({
        center,
        zoom: PLACE_ZOOM,
        padding: getMapPadding(true),
        duration: reducedMotion ? 0 : 600,
      })
    }
  }

  return (
    <div className="flex flex-col">
      <div className="bg-surface sticky top-0 z-10 flex items-center justify-between gap-2 px-4 pt-3 pb-2">
        <h1
          ref={titleRef}
          tabIndex={-1}
          className="text-ink min-w-0 truncate text-sm leading-5 font-semibold outline-none"
        >
          {copy.report.panelTitle}
        </h1>
        <button
          type="button"
          onClick={back}
          aria-label={copy.panel.backHome}
          className={cn(
            'text-ink-2 hover:bg-surface-muted rounded-ctl flex size-11 shrink-0 items-center justify-center transition-colors',
            focusRing,
          )}
        >
          <X className="size-4 shrink-0" strokeWidth={2} aria-hidden />
        </button>
      </div>

      <div className="flex flex-col gap-6 px-4 pt-3 pb-6">
        <p className="text-ink-2 text-xs leading-4">{copy.report.panelHint}</p>
        {isPending ? (
          <p className="text-ink-2 text-sm leading-5">{copy.common.loading}</p>
        ) : groups.length === 0 ? (
          <p className="text-ink-2 text-sm leading-5">{copy.report.groupedEmpty}</p>
        ) : (
          groups.map((group) => (
            <section key={group.name} className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className={T.section}>{group.name}</h2>
                <span className="text-ink text-xs leading-4 font-semibold tabular-nums">
                  {copy.report.badge(String(group.total))}
                </span>
              </div>
              <ul className="flex flex-col">
                {group.items.map((item) => (
                  <li key={item.region_code}>
                    <button
                      type="button"
                      onClick={(e) => openRegion(e.currentTarget, item)}
                      className={cn(
                        'rounded-ctl hover:bg-surface-muted flex w-full items-center gap-3 px-2 py-3 text-left transition-colors duration-150',
                        focusRing,
                      )}
                    >
                      <span className="text-ink min-w-0 flex-1 truncate text-sm leading-5 font-medium">
                        {nameOf(item.region_code)}
                      </span>
                      <span className="text-ink shrink-0 font-mono text-sm leading-5 font-semibold tabular-nums">
                        {formatNumber(item.count)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  )
}
