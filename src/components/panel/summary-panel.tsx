import { Clock, CloudOff, Filter, Flame, SearchX, ShieldCheck } from 'lucide-react'
import type { RefObject } from 'react'
import { useMemo } from 'react'

import { EmptyState, HintButton, SectionLabel, Skeleton } from '@/components/common'
import { CatalogRegionRow } from '@/components/panel/catalog-region-row'
import { LocationCard } from '@/components/panel/location-card'
import { NoHotspotDetail } from '@/components/panel/no-hotspot-detail'
import { ProvinceSearchRow } from '@/components/panel/province-search-row'
import { RegionDetailPanel } from '@/components/panel/region-detail-panel'
import { RegionRow } from '@/components/panel/region-row'
import type { MapRef } from '@/components/ui/map'
import { useRegionCatalog, useMeta } from '@/data/queries'
import type { Region } from '@/data/types'
import { copy } from '@/copy/id'
import { filterRegions } from '@/lib/filter-regions'
import { formatDateTime, formatNumber } from '@/lib/format'
import { aggregateByProvince } from '@/lib/province-aggregates'
import { RISK_CATEGORIES } from '@/lib/risk-category'
import { searchWilayah } from '@/lib/search-wilayah'
import { computeSummary } from '@/lib/summary'
import { useMapStore } from '@/store/map'

type MetaStatusKey = keyof NonNullable<ReturnType<typeof useMeta>['data']>['status']

const SOURCE_LABEL: Record<'firms' | 'weather' | 'air', string> = {
  firms: copy.source.firms,
  weather: copy.source.cuaca,
  air: copy.source.udara,
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
  const resetHome = useMapStore((s) => s.resetHome)
  const { data: meta } = useMeta()
  const {
    data: daftar,
    isPending: daftarPending,
    isError: daftarError,
    refetch: refetchDaftar,
  } = useRegionCatalog()

  const selected = useMemo(
    () => regions.find((r) => r.code === selectedCode) ?? null,
    [regions, selectedCode],
  )

  const selectedCatalog = useMemo(() => {
    if (selected || !selectedCode || !daftar) return null
    return daftar.regencies.find((k) => k.code === selectedCode) ?? null
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
          onRetry ? { label: copy.empty.loadFail.action, onClick: onRetry } : undefined
        }
      />
    )
  }

  if (selected) {
    return <RegionDetailPanel region={selected} />
  }

  if (selectedCatalog) {
    return <NoHotspotDetail kab={selectedCatalog} />
  }

  const wilayahLabel = province === 'Semua' ? copy.common.indonesia : province
  const title =
    province === 'Semua' ? copy.panel.indonesiaToday : copy.panel.provinceToday(province)
  const searching = query.trim().length > 0
  const filtering = selectedCategories.size > 0
  const nationalView = province === 'Semua'
  const topProvinces =
    !searching && nationalView && daftar
      ? aggregateByProvince(viewRegions, daftar.provinces).slice(0, 5)
      : []
  const list = searching || nationalView ? [] : filtered.slice(0, 5)
  const summary = computeSummary(viewRegions)
  const noHotspots = summary.todayTotal === 0

  const lateSources = meta
    ? (Object.keys(meta.status) as MetaStatusKey[]).filter(
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

  // key: province only — query in key remounts every keystroke (flash putih).
  return (
    <div key={`summary-${province}`} className="animate-view-in space-y-6">
      <header className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-ink min-w-0 text-xl font-semibold">{title}</h2>
          <HintButton
            className="shrink-0"
            ariaLabel={copy.panel.betaTooltip}
            text={copy.panel.betaTooltip}
          />
        </div>
        <p className="text-ink-2 text-sm text-pretty">{copy.panel.subtitle}</p>
      </header>

      {lateSources.length > 0 && meta && (
        <EmptyState
          icon={Clock}
          title={copy.empty.dataLate.title}
          description={copy.empty.dataLate.description(
            formatDateTime(meta.updated_at, 'WIB'),
            lateSources.map((k) => SOURCE_LABEL[k]).join(', '),
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
            <div className="flex min-w-0 flex-col gap-1">
              <div className="text-ink-2 flex items-center gap-1">
                <Flame className="size-4 shrink-0" strokeWidth={2} aria-hidden />
                <p className="text-xs font-medium">{copy.panel.hotspot24h}</p>
                <HintButton
                  ariaLabel={copy.panel.hotspotHint}
                  text={copy.panel.hotspotTooltip}
                />
              </div>
              <p className="text-ink font-mono text-3xl font-semibold tracking-[-0.02em]">
                {formatNumber(summary.todayTotal)}
              </p>
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
              action={{
                label: copy.empty.searchMiss.action,
                onClick: resetHome,
              }}
            />
          ) : (
            <>
              {searchHits.provinces.length > 0 && (
                <div>
                  <SectionLabel className="mb-2">{copy.search.provinces}</SectionLabel>
                  <ul className="flex flex-col">
                    {searchHits.provinces.map((hit) => (
                      <li key={hit.province.code}>
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
                      <li key={hit.kab.code}>
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
          <SectionLabel className="mb-2">
            {nationalView ? copy.panel.topRisk : copy.panel.topKab}
          </SectionLabel>
          {nationalView ? (
            filtering && viewRegions.length === 0 ? (
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
            ) : daftarPending && !daftar ? (
              <Skeleton className="min-h-16 w-full" />
            ) : topProvinces.length === 0 ? (
              <EmptyState
                icon={ShieldCheck}
                title={copy.empty.noHotspots.title}
                description={copy.empty.noHotspots.description(wilayahLabel)}
              />
            ) : (
              <ul className="flex flex-col">
                {topProvinces.map((agg) => {
                  const prov = daftar?.provinces.find((p) => p.name === agg.name)
                  if (!prov) return null
                  return (
                    <li key={prov.code}>
                      <ProvinceSearchRow
                        province={prov}
                        hotspotCount={agg.hotspots_24h}
                        countKind="titik"
                        riskCategory={agg.risk_category}
                        mapRef={mapRef}
                      />
                    </li>
                  )
                })}
              </ul>
            )
          ) : list.length === 0 ? (
            filtering ? (
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
                <li key={region.code}>
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
            <Skeleton className="rounded-ctl min-h-16 w-full" />
          </li>
        ))}
      </ul>
    </div>
  )
}
