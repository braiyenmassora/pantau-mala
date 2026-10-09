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
import { LocationCard } from '@/components/panel/location-card'
import { RegionDetailPanel } from '@/components/panel/region-detail-panel'
import { RegionRow } from '@/components/panel/region-row'
import { Sparkline } from '@/components/panel/sparkline'
import type { MapRef } from '@/components/ui/map'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useMeta } from '@/data/queries'
import type { Region, SourceStatus } from '@/data/types'
import { copy } from '@/copy/id'
import { formatDateTime, formatNumber, formatPercent } from '@/lib/format'
import { RISK_CATEGORIES } from '@/lib/risk-category'
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

  const selected = useMemo(
    () => regions.find((r) => r.kode === selectedCode) ?? null,
    [regions, selectedCode],
  )

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
    return <RegionDetailPanel region={selected} />
  }

  const wilayahLabel = province === 'Semua' ? 'Indonesia' : province
  const title =
    province === 'Semua'
      ? copy.panel.indonesiaToday
      : copy.panel.provinceToday(province)
  const searching = query.trim().length > 0
  const filtering = selectedCategories.size > 0
  const list = searching ? filtered : filtered.slice(0, 5)
  const sectionLabel = searching ? copy.panel.searchResults : copy.panel.topRisk
  const summary = computeSummary(filtered)
  const noHotspots = summary.todayTotal === 0

  const lateSources = meta
    ? (Object.keys(meta.status) as (keyof MetaSources)[]).filter(
        (k) => meta.status[k] === 'terlambat',
      )
    : []

  return (
    <div key={`summary-${province}-${query}`} className="animate-view-in space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-ink">{title}</h2>
          <p className="mt-1 text-sm text-ink-2">{copy.panel.subtitle}</p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Badge variant="beta" />
            </span>
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

      <LocationCard regions={regions} />

      {noHotspots ? (
        <EmptyState
          icon={ShieldCheck}
          title={copy.empty.noHotspots.title}
          description={copy.empty.noHotspots.description(wilayahLabel)}
        />
      ) : (
        <section className="rounded-card bg-surface-muted p-4">
          <div className="flex items-center gap-1">
            <p className="text-xs font-medium text-ink-2">{copy.panel.hotspot24h}</p>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    'text-ink-3 transition-colors duration-150 ease-in-out hover:text-ink-2',
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

          <div className="mt-2 flex items-end justify-between gap-3">
            <div>
              <p className="font-mono text-3xl font-semibold tracking-[-0.02em] text-ink">
                {formatNumber(summary.todayTotal)}
              </p>
              <ChangeLine
                today={summary.todayTotal}
                yesterday={summary.yesterdayTotal}
                changePercent={summary.changePercent}
              />
            </div>
            <div className="flex flex-col items-end gap-1">
              <Sparkline
                values={summary.totalsByDay}
                width={128}
                height={40}
                color={RISK_CATEGORIES.sangat_tinggi.dot}
              />
              <span className="text-xs text-ink-2">{copy.panel.last7days}</span>
            </div>
          </div>
        </section>
      )}

      <section>
        <SectionLabel className="mb-2">{sectionLabel}</SectionLabel>
        {list.length === 0 ? (
          searching ? (
            <EmptyState
              icon={SearchX}
              title={copy.empty.searchMiss.title}
              description={copy.empty.searchMiss.description}
            />
          ) : filtering ? (
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
    </div>
  )
}

function SummarySkeleton() {
  return (
    <div className="space-y-6" aria-busy aria-label="Memuat">
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
    return <p className="mt-1 text-sm text-ink-2">{copy.panel.newToday}</p>
  }

  if (changePercent === 0) {
    return <p className="mt-1 text-sm text-ink-2">{copy.panel.sameAsYesterday}</p>
  }

  if (changePercent == null) return null

  const up = changePercent > 0
  return (
    <p className="mt-1 text-sm text-risk-high-text">
      {copy.panel.vsYesterday(formatPercent(Math.abs(changePercent)), up)}
    </p>
  )
}
