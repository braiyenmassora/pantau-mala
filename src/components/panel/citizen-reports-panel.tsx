import { ChevronRight, ClipboardList, X } from 'lucide-react'
import { useEffect, useMemo, useRef, type RefObject } from 'react'

import { CloseIconButton, EmptyState } from '@/components/common'
import { focusRing } from '@/components/common/focus-ring'
import { Card, CardContent } from '@/components/ui/card'
import type { MapRef } from '@/components/ui/map'
import { getCopy } from '@/copy'
import { useReportCountsByRegion, type ReportRegionCount } from '@/data/hotspot-reports'
import { useRegionCatalog } from '@/data/queries'
import type { Region } from '@/data/types'
import { rememberFocusTrigger, restoreFocusTrigger } from '@/lib/focus-return'
import { formatNumber } from '@/lib/format'
import { getMapPadding, PLACE_ZOOM } from '@/lib/indonesia-view'
import { PANEL, T } from '@/lib/pola'
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
        getCopy().report.otherRegions
      const group = byProvince.get(province) ?? { name: province, total: 0, items: [] }
      group.total += item.count
      group.items.push(item)
      byProvince.set(province, group)
    }
    return [...byProvince.values()]
      .map((g) => ({
        ...g,
        items: [...g.items].sort((a, b) => b.count - a.count),
      }))
      .sort((a, b) => b.total - a.total)
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
      <div className={cn(PANEL.stickyHeader, PANEL.pad, PANEL.header, 'space-y-1')}>
        <div className="flex items-center justify-between gap-2">
          <h1
            ref={titleRef}
            tabIndex={-1}
            className={cn(T.title, 'min-w-0 truncate outline-none')}
          >
            {getCopy().report.panelTitle}
          </h1>
          <CloseIconButton onClick={back} aria-label={getCopy().report.close}>
            <X className="size-4 shrink-0" strokeWidth={2} aria-hidden />
          </CloseIconButton>
        </div>
        <p className={T.quiet}>{getCopy().report.panelHint}</p>
      </div>

      <div className={cn(PANEL.body, PANEL.pad)}>
        {isPending ? (
          <p className={cn(T.body, 'text-ink-2')} aria-busy="true">
            {getCopy().common.loading}
          </p>
        ) : groups.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title={getCopy().report.panelTitle}
            description={getCopy().report.groupedEmpty}
          />
        ) : (
          groups.map((group) => (
            <Card key={group.name} aria-label={group.name} className="overflow-hidden">
              <div
                className={cn(
                  'border-line flex items-center justify-between gap-2 border-b',
                  PANEL.pad,
                  PANEL.header,
                )}
              >
                <h2 className={T.section}>{group.name}</h2>
                <span className={cn(T.meta, 'shrink-0 tabular-nums')}>
                  {getCopy().report.badge(String(group.total))}
                </span>
              </div>
              <CardContent className="px-0 pt-0 pb-1">
                <ul className="flex flex-col">
                  {group.items.map((item, i) => (
                    <li
                      key={item.region_code}
                      className={cn(i > 0 && 'border-line border-t')}
                    >
                      <button
                        type="button"
                        onClick={(e) => openRegion(e.currentTarget, item)}
                        className={cn(
                          'hover:bg-surface-muted flex w-full items-center gap-3 px-4 py-2 text-left transition-colors duration-150',
                          focusRing,
                          'rounded-none',
                        )}
                      >
                        <span className={cn(T.body, 'min-w-0 flex-1 truncate')}>
                          {nameOf(item.region_code)}
                        </span>
                        <span className={cn(T.title, 'shrink-0 font-mono tabular-nums')}>
                          {formatNumber(item.count)}
                        </span>
                        <ChevronRight
                          className="text-brand size-4 shrink-0"
                          strokeWidth={2}
                          aria-hidden
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
