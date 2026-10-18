import {
  Check,
  CloudOff,
  Filter,
  Minus,
  Search,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react'
import type { RefObject } from 'react'
import { useMemo } from 'react'

import {
  EmptyState,
  HotspotStatusBadge,
  InfoTooltip,
  Skeleton,
} from '@/components/common'
import { Brand } from '@/components/common/brand'
import { focusRing } from '@/components/common/focus-ring'
import { DataFreshnessBanner } from '@/components/panel/data-freshness-banner'
import { LocationCard } from '@/components/panel/location-card'
import { NoHotspotDetail } from '@/components/panel/no-hotspot-detail'
import { RegionDetailPanel } from '@/components/panel/region-detail-panel'
import { RegionRow } from '@/components/panel/region-row'
import { SearchBox } from '@/components/panel/search-box'
import { TopProvincesList } from '@/components/panel/top-provinces-list'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { MapRef } from '@/components/ui/map'
import { copy } from '@/copy/id'
import { useRegionCatalog } from '@/data/queries'
import type { Region } from '@/data/types'
import { filterRegions } from '@/lib/filter-regions'
import { formatNumber } from '@/lib/format'
import { focusWilayahSearch } from '@/lib/geolocation'
import { hotspotTrend, type TrendDirection } from '@/lib/hotspot-trend'
import { fitIndonesia } from '@/lib/indonesia-view'
import { aggregateByProvince } from '@/lib/province-aggregates'
import { RISK_CATEGORIES } from '@/lib/risk-category'
import { worstRiskCategory } from '@/lib/risk-rule'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

type SummaryPanelProps = {
  regions: Region[]
  filtered: Region[]
  mapRef: RefObject<MapRef | null>
  isPending: boolean
  isError: boolean
  onRetry?: () => void
}

const TREND_UI: Record<TrendDirection, { label: string; Icon: typeof TrendingUp }> = {
  naik: { label: copy.detail.trendUp, Icon: TrendingUp },
  turun: { label: copy.detail.trendDown, Icon: TrendingDown },
  stabil: { label: copy.detail.trendFlat, Icon: Minus },
}

// ponytail: panel kiri 400px tanpa divider, beranda 5 baris, provinsi 10 baris.
export function SummaryPanel({
  regions,
  filtered,
  mapRef,
  isPending,
  isError,
  onRetry,
}: SummaryPanelProps) {
  const province = useMapStore((s) => s.province)
  const setProvince = useMapStore((s) => s.setProvince)
  const query = useMapStore((s) => s.query)
  const selectedCode = useMapStore((s) => s.selectedCode)
  const selectedCategories = useMapStore((s) => s.selectedCategories)
  const wilayahNotFound = useMapStore((s) => s.wilayahNotFound)
  const setWilayahNotFound = useMapStore((s) => s.setWilayahNotFound)
  const panelOpen = useUiStore((s) => s.panelOpen)

  const { data: daftar, isPending: daftarPending } = useRegionCatalog()

  const selected = useMemo(
    () => regions.find((r) => r.code === selectedCode) ?? null,
    [regions, selectedCode],
  )

  const selectedCatalog = useMemo(() => {
    if (selected || !selectedCode || !daftar) return null
    return daftar.regencies.find((k) => k.code === selectedCode) ?? null
  }, [selected, selectedCode, daftar])

  const viewRegions = useMemo(
    () =>
      filterRegions(regions, {
        province,
        selectedCategories,
        query: '',
      }),
    [regions, province, selectedCategories],
  )

  const nationalView = province === 'Semua'
  const searching = query.trim().length > 0

  const pinRisk = selectedCategories.size === 1 ? [...selectedCategories][0] : undefined

  const topProvinces = useMemo(() => {
    if (!nationalView || !daftar) return []
    return aggregateByProvince(
      viewRegions,
      daftar.provinces,
      pinRisk ? { pinRisk } : undefined,
    ).slice(0, 5)
  }, [nationalView, daftar, viewRegions, pinRisk])

  // Semua kab/kota di provinsi (Sangat tinggi + Sedang + Rendah), urut risiko.
  // Jangan di-slice: top-10 memotong Sedang bila Sangat tinggi ≥10.
  const provinceTopRegencies = useMemo(() => {
    if (nationalView) return []
    return filterRegions(regions, {
      province,
      selectedCategories: new Set(),
      query: '',
    })
  }, [nationalView, regions, province])

  // Agregat untuk identitas provinsi terpilih — badge = worst kab/kota (sama chip filter)
  const provinceStats = useMemo(() => {
    if (nationalView) return null
    const provRegions = regions.filter((r) => r.province === province)
    const count_24h = provRegions.reduce((sum, r) => sum + r.hotspots_24h, 0)
    const risk_category = worstRiskCategory(provRegions)

    const trend7d = [0, 0, 0, 0, 0, 0, 0]
    for (const r of provRegions) {
      if (r.trend_7d) {
        for (let i = 0; i < 7; i++) {
          trend7d[i] += r.trend_7d[i] ?? 0
        }
      }
    }
    return { count_24h, risk_category, trend_7d: trend7d }
  }, [nationalView, regions, province])

  if (isPending) {
    return <SummarySkeleton nationalView={nationalView} />
  }

  if (isError) {
    const offline = typeof navigator !== 'undefined' && navigator.onLine === false
    const fail = offline ? copy.empty.offline : copy.empty.loadFail
    return (
      <div className="flex flex-col gap-6 px-4 pt-3 pb-6">
        <EmptyState
          icon={CloudOff}
          variant="action"
          className="border-risk-mid/40 bg-risk-mid-tint text-risk-mid-text"
          title={fail.title}
          description={fail.description}
          action={onRetry ? { label: fail.action, onClick: onRetry } : undefined}
        />
      </div>
    )
  }

  if (selected) {
    return <RegionDetailPanel key={selected.code} region={selected} mapRef={mapRef} />
  }

  if (selectedCatalog) {
    return <NoHotspotDetail kab={selectedCatalog} />
  }

  if (wilayahNotFound) {
    return (
      <div className="flex flex-col gap-6 p-4">
        <header className="space-y-3">
          <Brand compact />
          <h1 className="text-ink truncate text-xl leading-8 font-semibold">
            {copy.panel.indonesiaToday}
          </h1>
        </header>
        <EmptyState
          icon={Search}
          variant="action"
          title={copy.empty.wilayahNotFound.title}
          description={copy.empty.wilayahNotFound.description}
          action={{
            label: copy.empty.wilayahNotFound.action,
            onClick: () => {
              setWilayahNotFound(false)
              if (window.location.pathname !== '/') {
                window.history.pushState(null, '', '/')
              }
              focusWilayahSearch()
            },
          }}
        />
      </div>
    )
  }

  const wilayahLabel = province === 'Semua' ? copy.common.indonesia : province
  const filtering = selectedCategories.size > 0
  const clearCategories = useMapStore.getState().clearCategories
  const noHotspots =
    regions.length === 0 || regions.reduce((s, r) => s + r.hotspots_24h, 0) === 0

  // Filter kosong jangan menelan mode cari — tanpa SearchBox query bisa “stuck”.
  if (filtering && filtered.length === 0 && !searching) {
    return (
      <div className="flex flex-col gap-6 p-4">
        <header className="space-y-3">
          <Brand compact />
          <h1 className="text-ink truncate text-xl leading-8 font-semibold">
            {copy.panel.indonesiaToday}
          </h1>
        </header>
        <EmptyState
          icon={Filter}
          title={copy.empty.noRegionsFilter.title}
          description={copy.empty.noRegionsFilter.description(
            [...selectedCategories].map((c) => RISK_CATEGORIES[c].label).join(', '),
            wilayahLabel,
          )}
          action={{
            label: copy.empty.noRegionsFilter.action,
            onClick: clearCategories,
          }}
        />
      </div>
    )
  }

  if (noHotspots && !filtering && !searching) {
    return (
      <div className="flex flex-col gap-6 p-4">
        <header className="space-y-3">
          <Brand compact />
          <div className="space-y-1">
            <div className="flex min-w-0 items-center gap-1">
              <h1 className="text-ink truncate text-xl leading-8 font-semibold">
                {copy.panel.indonesiaToday}
              </h1>
              <InfoTooltip content={copy.panel.titleTip} className="-my-4" />
            </div>
            <p className="text-ink-2 text-xs leading-4">{copy.panel.limitationNote}</p>
            <p className="text-ink-2 text-xs leading-4">{copy.panel.coverageNote}</p>
          </div>
        </header>
        <DataFreshnessBanner />
        <EmptyState
          icon={ShieldCheck}
          title={copy.empty.noHotspots.title}
          description={copy.empty.noHotspots.description(wilayahLabel)}
        />
      </div>
    )
  }

  // Beranda nasional + hasil cari: SearchBox tetap di sticky yang sama (hindari remount → fokus stuck).
  // Spacing DS: gutter 16 · sticky→konten 24 (pb-3+pt-3) · antar section 24 · dalam section 12.
  if (nationalView || searching) {
    return (
      <div className="flex flex-col">
        <div className="bg-surface sticky top-0 z-10 space-y-3 px-4 pt-3 pb-2">
          <Brand compact />
          <SearchBox mapRef={mapRef} />
        </div>

        <div className="flex flex-col gap-6 px-4 pt-3 pb-6">
          <DataFreshnessBanner />
          {searching ? (
            <section className="space-y-3">
              <h2 className="text-ink text-sm leading-5 font-semibold">
                {copy.panel.searchResults}
              </h2>
              {filtered.length === 0 ? (
                <EmptyState
                  icon={Search}
                  title={copy.empty.searchMiss.title}
                  description={copy.empty.searchMiss.description}
                />
              ) : (
                <ul className="flex flex-col">
                  {filtered.map((region) => (
                    <li key={region.code}>
                      <RegionRow region={region} mapRef={mapRef} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : (
            <>
              <header className="space-y-1">
                <div className="flex min-w-0 items-center gap-1">
                  <h1 className="text-ink min-w-0 text-xl leading-8 font-semibold break-words">
                    {copy.panel.indonesiaToday}
                  </h1>
                  <InfoTooltip content={copy.panel.titleTip} className="-my-4" />
                </div>
                <p className="text-ink-2 text-xs leading-4">
                  {copy.panel.limitationNote}
                </p>
              </header>

              <LocationCard regions={regions} />

              <section className="space-y-3">
                <h2 className="text-ink text-sm leading-5 font-semibold">
                  {copy.panel.topRisk}
                </h2>
                {daftarPending && !daftar ? (
                  <div className="flex flex-col gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="rounded-ctl h-12 w-full" />
                    ))}
                  </div>
                ) : topProvinces.length === 0 ? (
                  <div className="text-ink-2 flex items-center gap-2 py-3 text-sm leading-5">
                    <Check className="text-ink-2 size-4" strokeWidth={2} aria-hidden />
                    <span>{copy.search.noHotspots}</span>
                  </div>
                ) : (
                  <TopProvincesList
                    items={topProvinces.flatMap((agg) => {
                      const prov = daftar?.provinces.find((p) => p.name === agg.name)
                      return prov
                        ? [
                            {
                              province: prov,
                              hotspots_24h: agg.hotspots_24h,
                              risk_category: agg.risk_category,
                              trend_7d: agg.trend_7d,
                            },
                          ]
                        : []
                    })}
                  />
                )}
              </section>
            </>
          )}
        </div>
      </div>
    )
  }

  // 3. Panel provinsi — kartu pola Gempa (judul di dalam · atas hanya X)
  const provTrend = hotspotTrend(provinceStats?.trend_7d ?? [0, 0, 0, 0, 0, 0, 0])
  const { label: trendLabel, Icon: TrendIcon } = TREND_UI[provTrend]

  return (
    <div className="flex flex-col">
      <div className="bg-surface sticky top-0 z-10 flex justify-end px-4 pt-3 pb-2">
        <button
          type="button"
          onClick={() => {
            setProvince('Semua')
            if (mapRef?.current) fitIndonesia(mapRef.current, panelOpen, 0)
          }}
          aria-label={copy.panel.closeDetail}
          className={cn(
            'text-ink-2 hover:bg-surface-muted rounded-ctl flex size-11 shrink-0 items-center justify-center transition-colors',
            focusRing,
          )}
        >
          <X className="size-4 shrink-0" strokeWidth={2} aria-hidden />
        </button>
      </div>

      <div className="flex flex-col gap-6 px-4 pt-3 pb-6">
        <DataFreshnessBanner />

        <Card aria-label={province}>
          <CardHeader>
            <div className="flex min-w-0 items-center gap-1">
              <h1 className="text-ink min-w-0 truncate text-sm leading-5 font-semibold">
                {province}
              </h1>
              <InfoTooltip content={copy.detail.riskTooltip} />
            </div>
            <HotspotStatusBadge
              hotspots={provinceStats?.count_24h ?? 0}
              riskCategory={provinceStats?.risk_category ?? 'tidak_tersedia'}
            />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <p className="text-ink font-mono text-3xl leading-10 font-semibold tabular-nums">
                {formatNumber(provinceStats?.count_24h ?? 0)}
              </p>
              <p className="text-ink text-sm leading-5">{copy.detail.hotspotUnitLine}</p>
            </div>
            <p className="text-ink-2 flex items-center gap-2 text-xs leading-4">
              <TrendIcon
                className={cn(
                  'size-3.5 shrink-0',
                  provTrend === 'naik' && 'panel-icon-trend-up',
                  provTrend === 'turun' && 'panel-icon-trend-down',
                )}
                strokeWidth={2}
                aria-hidden
              />
              <span>
                {trendLabel} {copy.detail.trendVsPrevious}
              </span>
            </p>
            {(provinceStats?.count_24h ?? 0) === 0 ? (
              <p className="text-ink-2 text-xs leading-4">{copy.panel.coverageNote}</p>
            ) : null}
          </CardContent>
        </Card>

        <section className="space-y-3">
          <h2 className="text-ink text-sm leading-5 font-semibold">
            {copy.panel.topKab}
          </h2>
          {provinceTopRegencies.length === 0 ? (
            <div className="text-ink-2 flex items-center gap-2 py-3 text-sm leading-5">
              <Check className="size-4" strokeWidth={2} aria-hidden />
              <span>{copy.search.noHotspots}</span>
            </div>
          ) : (
            <ul className="flex flex-col">
              {provinceTopRegencies.map((region) => (
                <li key={region.code}>
                  <RegionRow region={region} mapRef={mapRef} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

function SummarySkeleton({ nationalView }: { nationalView: boolean }) {
  const rowCount = nationalView ? 5 : 10
  return (
    <div className="flex flex-col" aria-busy aria-label={copy.common.loading}>
      <div className="bg-surface sticky top-0 z-10 space-y-3 px-4 pt-3 pb-2">
        <Skeleton className="rounded-ctl h-7 w-28" />
        <Skeleton className="rounded-ctl h-12 w-full" />
      </div>
      <div className="flex flex-col gap-6 px-4 pt-3 pb-6">
        <div className="space-y-1">
          <Skeleton className="rounded-ctl h-8 w-3/4" />
          <Skeleton className="rounded-ctl h-4 w-1/2" />
        </div>
        {nationalView ? <Skeleton className="rounded-ctl h-24 w-full" /> : null}
        <div className="space-y-3">
          <Skeleton className="rounded-ctl h-5 w-1/3" />
          <div className="flex flex-col gap-1">
            {Array.from({ length: rowCount }).map((_, i) => (
              <Skeleton key={i} className="rounded-ctl h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
