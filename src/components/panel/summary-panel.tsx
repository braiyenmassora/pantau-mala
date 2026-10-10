import {
  Clock,
  CloudOff,
  Filter,
  Info,
  SearchX,
  ShieldCheck,
} from 'lucide-react'
import type { RefObject } from 'react'
import { useMemo } from 'react'

import { Badge, EmptyState, SectionLabel, Skeleton } from '@/components/common'
import { focusRing } from '@/components/common/focus-ring'
import { CatalogRegionRow } from '@/components/panel/catalog-region-row'
import { LocationCard } from '@/components/panel/location-card'
import { NoHotspotDetail } from '@/components/panel/no-hotspot-detail'
import { ProvinceSearchRow } from '@/components/panel/province-search-row'
import { RegionDetailPanel } from '@/components/panel/region-detail-panel'
import { RegionRow } from '@/components/panel/region-row'
import { Sparkline } from '@/components/panel/sparkline'
import type { MapRef } from '@/components/ui/map'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useDaftarWilayah, useMeta } from '@/data/queries'
import type { Region, SourceStatus } from '@/data/types'
import { copy } from '@/copy/id'
import { filterRegions } from '@/lib/filter-regions'
import { formatDateTime, formatNumber, formatPercent } from '@/lib/format'
import { RISK_CATEGORIES } from '@/lib/risk-category'
import { searchWilayah } from '@/lib/search-wilayah'
import { computeSummary } from '@/lib/summary'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'

type MetaSources = {
  firms: SourceStatus
  cuaca: SourceStatus
  udara: SourceStatus
}

type SummaryPanelProps = {
  regions: Region[]
  filtered: Region[]
  mapRef: RefObject<MapRef | null>
  isPending: boolean
  isError: boolean
  onRetry?: () => void
}

export function SummaryPanel({
  regions,
  filtered,
  mapRef,
  isPending,
  isError,
  onRetry,
}: SummaryPanelProps) {
  const province = useMapStore((s) => s.province)
  const query = useMapStore((s) => s.query)
  const selectedCode = useMapStore((s) => s.selectedCode)
  const selectedCategories = useMapStore((s) => s.selectedCategories)
  const clearCategories = useMapStore((s) => s.clearCategories)
  const { data: meta } = useMeta()
  const {
    data: daftar,
    isPending: daftarPending,
    isError: daftarError,
    refetch: refetchDaftar,
  } = useDaftarWilayah()

  const selected = useMemo(
    () => regions.find((r) => r.kode === selectedCode) ?? null,
    [regions, selectedCode],
  )

  const selectedCatalog = useMemo(() => {
    if (selected || !selectedCode || !daftar) return null
    return daftar.kabkota.find((k) => k.kode === selectedCode) ?? null
  }, [selected, selectedCode, daftar])

  /** Hotspot card ignores search query — province + category only. */
  const viewRegions = useMemo(
    () =>
      filterRegions(regions, {
        province,
        selectedCategories,
        query: '',
      }),
    [regions, province, selectedCategories],
  )

  const searchHits = useMemo(() => {
    if (!daftar || !query.trim()) return null
    return searchWilayah(daftar, regions, query)
  }, [daftar, regions, query])

  if (isPending) {
    return <SummarySkeleton />
  }

  if (isError) {
    return (
      <EmptyState
        icon={CloudOff}
        title={copy.empty.loadFail.title}
        description={copy.empty.loadFail.description}
        action={
          onRetry
            ? { label: copy.empty.loadFail.action, onClick: onRetry }
            : undefined
        }
      />
    )
  }

  if (selected) {
    return <RegionDetailPanel region={selected} mapRef={mapRef} />
  }

  if (selectedCatalog) {
    return <NoHotspotDetail kab={selectedCatalog} />
  }

  const wilayahLabel =
    province === 'Semua' ? copy.common.indonesia : province
  const title =
    province === 'Semua'
      ? copy.panel.indonesiaToday
      : copy.panel.provinceToday(province)
  const searching = query.trim().length > 0
  const filtering = selectedCategories.size > 0
  const list = searching ? [] : filtered.slice(0, 5)
  const summary = computeSummary(viewRegions)
  const noHotspots = summary.todayTotal === 0
  const showSpark =
    summary.totalsByDay.length >= 2 &&
    !summary.totalsByDay.every((v) => v === 0)

  const lateSources = meta
    ? (Object.keys(meta.status) as (keyof MetaSources)[]).filter(
        (k) => meta.status[k] === 'terlambat',
      )
    : []

  const searchEmpty =
    searching &&
    searchHits &&
    searchHits.provinces.length === 0 &&
    searchHits.kabkota.length === 0

  if (searching && daftarError) {
    return (
      <EmptyState
        icon={CloudOff}
        title={copy.empty.loadFail.title}
        description={copy.empty.loadFail.description}
        action={{
          label: copy.empty.loadFail.action,
          onClick: () => {
            void refetchDaftar()
          },
        }}
      />
    )
  }

  return (
    <div key={`summary-${province}-${query}`} className="animate-view-in space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-ink">{title}</h2>
          <p className="mt-1 text-sm text-ink-2">{copy.panel.subtitle}</p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className={cn('rounded-ctl', focusRing)}
              aria-label={copy.panel.betaTooltip}
            >
              <Badge variant="beta" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="rounded-ctl">
            {copy.panel.betaTooltip}
          </TooltipContent>
        </Tooltip>
      </header>

      {lateSources.length > 0 && meta && (
        <EmptyState
          icon={Clock}
          title={copy.empty.dataLate.title}
          description={copy.empty.dataLate.description(
            formatDateTime(meta.diperbarui, 'WIB'),
            lateSources.map((k) => copy.source[k]).join(', '),
          )}
        />
      )}

      {!searching && <LocationCard regions={regions} />}

      {!searching &&
        (noHotspots ? (
          <EmptyState
            icon={ShieldCheck}
            title={copy.empty.noHotspots.title}
            description={copy.empty.noHotspots.description(wilayahLabel)}
          />
        ) : (
          <section className="rounded-card bg-surface-muted p-4">
            <div className="flex items-end justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex items-center gap-1">
                  <p className="text-xs font-medium text-ink-2">
                    {copy.panel.hotspot24h}
                  </p>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          'text-ink-2 transition-colors duration-150 ease-in-out hover:text-ink',
                          focusRing,
                          'rounded-ctl',
                        )}
                        aria-label={copy.panel.hotspotHint}
                      >
                        <Info className="size-3.5" strokeWidth={2} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs rounded-ctl">
                      {copy.panel.hotspotTooltip}
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="font-mono text-3xl font-semibold tracking-[-0.02em] text-ink">
                  {formatNumber(summary.todayTotal)}
                </p>
                <ChangeLine
                  today={summary.todayTotal}
                  yesterday={summary.yesterdayTotal}
                  changePercent={summary.changePercent}
                />
              </div>
              {showSpark && (
                <div className="flex flex-col items-end gap-1">
                  <Sparkline
                    values={summary.totalsByDay}
                    width={128}
                    height={40}
                    color={RISK_CATEGORIES.sangat_tinggi.dot}
                  />
                  <span className="text-xs text-ink-2">{copy.panel.last7days}</span>
                </div>
              )}
            </div>
          </section>
        ))}

      {searching ? (
        <section className="space-y-6">
          <SectionLabel>{copy.panel.searchResults}</SectionLabel>
          {daftarPending && !searchHits ? (
            <Skeleton className="min-h-16 w-full" />
          ) : searchEmpty || !searchHits ? (
            <EmptyState
              icon={SearchX}
              title={copy.empty.searchMiss.title}
              description={copy.empty.searchMiss.description}
            />
          ) : (
            <>
              {searchHits.provinces.length > 0 && (
                <div>
                  <SectionLabel className="mb-2">{copy.search.provinces}</SectionLabel>
                  <ul className="flex flex-col">
                    {searchHits.provinces.map((hit) => (
                      <li key={hit.province.kode}>
                        <ProvinceSearchRow
                          province={hit.province}
                          hotspotCount={hit.hotspotCount}
                          mapRef={mapRef}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {searchHits.kabkota.length > 0 && (
                <div>
                  <SectionLabel className="mb-2">{copy.search.kabkota}</SectionLabel>
                  <ul className="flex flex-col">
                    {searchHits.kabkota.map((hit) => (
                      <li key={hit.kab.kode}>
                        {hit.region ? (
                          <RegionRow region={hit.region} mapRef={mapRef} />
                        ) : (
                          <CatalogRegionRow kab={hit.kab} mapRef={mapRef} />
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </section>
      ) : (
        <section>
          <SectionLabel className="mb-2">{copy.panel.topRisk}</SectionLabel>
          {list.length === 0 ? (
            filtering ? (
              <EmptyState
                icon={Filter}
                title={copy.empty.noRegionsFilter.title}
                description={copy.empty.noRegionsFilter.description(
                  [...selectedCategories]
                    .map((c) => RISK_CATEGORIES[c].label)
                    .join(', '),
                  wilayahLabel,
                )}
                action={{
                  label: copy.empty.noRegionsFilter.action,
                  onClick: clearCategories,
                }}
              />
            ) : (
              <EmptyState
                icon={ShieldCheck}
                title={copy.empty.noHotspots.title}
                description={copy.empty.noHotspots.description(wilayahLabel)}
              />
            )
          ) : (
            <ul className="flex flex-col">
              {list.map((region) => (
                <li key={region.kode}>
                  <RegionRow region={region} mapRef={mapRef} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}

function SummarySkeleton() {
  return (
    <div className="space-y-6" aria-busy aria-label={copy.common.loading}>
      <Skeleton className="h-32 w-full" />
      <ul className="flex flex-col gap-2">
        {Array.from({ length: 5 }, (_, i) => (
          <li key={i}>
            <Skeleton className="min-h-16 w-full rounded-ctl" />
          </li>
        ))}
      </ul>
    </div>
  )
}

function ChangeLine({
  today,
  yesterday,
  changePercent,
}: {
  today: number
  yesterday: number
  changePercent: number | null
}) {
  if (yesterday === 0 && today === 0) return null

  if (yesterday === 0 && today > 0) {
    return <p className="text-sm text-ink-2">{copy.panel.newToday}</p>
  }

  if (changePercent === 0) {
    return <p className="text-sm text-ink-2">{copy.panel.sameAsYesterday}</p>
  }

  if (changePercent == null) return null

  const up = changePercent > 0
  return (
    <p className="text-sm tabular-nums text-ink">
      {copy.panel.vsYesterday(formatPercent(Math.abs(changePercent)), up)}
    </p>
  )
}
