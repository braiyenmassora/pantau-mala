import { CloudOff, Filter, SearchX, ShieldCheck } from 'lucide-react'
import type { RefObject } from 'react'
import { useMemo } from 'react'

import { EmptyState, SectionLabel, Skeleton } from '@/components/common'
import { Brand } from '@/components/common/brand'
import { CatalogRegionRow } from '@/components/panel/catalog-region-row'
import { LocationCard } from '@/components/panel/location-card'
import { NoHotspotDetail } from '@/components/panel/no-hotspot-detail'
import { PanelFilters } from '@/components/panel/panel-filters'
import { ProvinceSearchRow } from '@/components/panel/province-search-row'
import { RegionDetailPanel } from '@/components/panel/region-detail-panel'
import { RegionRow } from '@/components/panel/region-row'
import { TopProvincesList } from '@/components/panel/top-provinces-list'
import type { MapRef } from '@/components/ui/map'
import { useRegionCatalog, useMeta } from '@/data/queries'
import type { Region } from '@/data/types'
import { copy } from '@/copy/id'
import { filterRegions } from '@/lib/filter-regions'
import { formatDateTime } from '@/lib/format'
import { aggregateByProvince } from '@/lib/province-aggregates'
import { RISK_CATEGORIES } from '@/lib/risk-category'
import { searchWilayah } from '@/lib/search-wilayah'
import { computeSummary } from '@/lib/summary'
import { useMapStore } from '@/store/map'

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
  const noHotspots = computeSummary(viewRegions).todayTotal === 0
  const updatedStamp = meta?.updated_at
    ? copy.detail.updatedAt(formatDateTime(meta.updated_at, 'WIB'))
    : null

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
    <div key={`summary-${province}`} className="space-y-6">
      {/* 1–3. Brand, judul, catatan */}
      {!searching && (
        <header className="space-y-3">
          <Brand textOnly />
          <div className="space-y-1">
            <h2 className="text-ink text-xl font-semibold">{title}</h2>
            <p className="text-ink-2 text-sm">{copy.panel.subtitle}</p>
            {updatedStamp ? (
              <p className="text-ink-3 text-xs">{updatedStamp}</p>
            ) : null}
          </div>
          <p role="note" className="text-ink-2 text-xs leading-4">
            {copy.panel.limitationNote}
          </p>
        </header>
      )}

      {/* 4. Filter */}
      {!searching && <PanelFilters regions={regions} />}

      {/* 5. Dekat kamu */}
      {!searching && <LocationCard regions={regions} />}

      {/* Search results */}
      {searching ? (
        <section className="space-y-4">
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
        /* 6. Provinsi / kab terbanyak */
        <section className="space-y-2">
          <div>
            <SectionLabel>
              {nationalView ? copy.panel.topRisk : copy.panel.topKab}
            </SectionLabel>
            {nationalView ? (
              <p className="text-ink-2 mt-1 text-xs leading-4">
                {copy.panel.topRiskHint}
              </p>
            ) : null}
          </div>

          {nationalView ? (
            filtering && viewRegions.length === 0 ? (
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
            ) : daftarPending && !daftar ? (
              <Skeleton className="min-h-16 w-full" />
            ) : topProvinces.length === 0 || (noHotspots && !filtering) ? (
              <EmptyState
                icon={ShieldCheck}
                title={
                  meta?.status.firms === 'ok'
                    ? copy.empty.noHotspots.title
                    : copy.extra.noDataset
                }
                description={
                  meta?.status.firms === 'ok'
                    ? copy.empty.noHotspots.description(wilayahLabel)
                    : copy.extra.noDatasetNote
                }
              />
            ) : (
              <TopProvincesList
                items={topProvinces.flatMap((agg) => {
                  const prov = daftar?.provinces.find((p) => p.name === agg.name)
                  return prov
                    ? [{ province: prov, hotspots_24h: agg.hotspots_24h }]
                    : []
                })}
              />
            )
          ) : list.length === 0 ? (
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
                title={
                  meta?.status.firms === 'ok'
                    ? copy.empty.noHotspots.title
                    : copy.extra.noDataset
                }
                description={
                  meta?.status.firms === 'ok'
                    ? copy.empty.noHotspots.description(wilayahLabel)
                    : copy.extra.noDatasetNote
                }
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
    <div className="space-y-6" aria-busy>
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-20 w-full" />
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
