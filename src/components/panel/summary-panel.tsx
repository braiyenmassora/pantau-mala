import {
  Check,
  CloudOff,
  Filter,
  Minus,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react'
import type { RefObject } from 'react'
import { useMemo } from 'react'

import { Badge, EmptyState, InfoTooltip, Skeleton, Sparkline } from '@/components/common'
import { Brand } from '@/components/common/brand'
import { focusRing } from '@/components/common/focus-ring'
import { LatestEarthquakeCard } from '@/components/panel/latest-earthquake-card'
import { LocationCard } from '@/components/panel/location-card'
import { NoHotspotDetail } from '@/components/panel/no-hotspot-detail'
import { RegionDetailPanel } from '@/components/panel/region-detail-panel'
import { RegionRow } from '@/components/panel/region-row'
import { SearchBox } from '@/components/panel/search-box'
import { TopProvincesList } from '@/components/panel/top-provinces-list'
import type { MapRef } from '@/components/ui/map'
import { copy } from '@/copy/id'
import { useMeta, useRegionCatalog } from '@/data/queries'
import type { Region, RiskCategory } from '@/data/types'
import { filterRegions } from '@/lib/filter-regions'
import { formatDateTime, formatNumber } from '@/lib/format'
import { hotspotTrend, type TrendDirection } from '@/lib/hotspot-trend'
import { fitIndonesia } from '@/lib/indonesia-view'
import { aggregateByProvince } from '@/lib/province-aggregates'
import { RISK_CATEGORIES } from '@/lib/risk-category'
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

const TREND_UI: Record<
  TrendDirection,
  { label: string; Icon: typeof TrendingUp; colorClass: string }
> = {
  naik: { label: copy.detail.trendUp, Icon: TrendingUp, colorClass: 'text-risk-high' },
  turun: {
    label: copy.detail.trendDown,
    Icon: TrendingDown,
    colorClass: 'text-risk-low',
  },
  stabil: { label: copy.detail.trendFlat, Icon: Minus, colorClass: 'text-ink-3' },
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
  const panelOpen = useUiStore((s) => s.panelOpen)

  const { data: meta } = useMeta()
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

  const topProvinces = useMemo(() => {
    if (!nationalView || !daftar) return []
    return aggregateByProvince(viewRegions, daftar.provinces).slice(0, 5)
  }, [nationalView, daftar, viewRegions])

  // Top 10 kabupaten untuk tampilan provinsi
  const provinceTopRegencies = useMemo(() => {
    if (nationalView) return []
    return filtered.slice(0, 10)
  }, [nationalView, filtered])

  // Agregat untuk identitas provinsi terpilih
  const provinceStats = useMemo(() => {
    if (nationalView) return null
    const provRegions = regions.filter((r) => r.province === province)
    const count_24h = provRegions.reduce((sum, r) => sum + r.hotspots_24h, 0)
    let risk_category: RiskCategory = 'rendah'
    if (count_24h >= 10) risk_category = 'sangat_tinggi'
    else if (count_24h >= 1) risk_category = 'sedang'

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
    return (
      <div className="p-4">
        <EmptyState
          icon={CloudOff}
          title={copy.empty.loadFail.title}
          description={copy.empty.loadFail.description}
          action={
            onRetry ? { label: copy.empty.loadFail.action, onClick: onRetry } : undefined
          }
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

  const updatedDate = meta?.updated_at ? formatDateTime(meta.updated_at, 'WIB') : ''

  const wilayahLabel = province === 'Semua' ? copy.common.indonesia : province
  const filtering = selectedCategories.size > 0
  const clearCategories = useMapStore.getState().clearCategories
  const noHotspots =
    regions.length === 0 || regions.reduce((s, r) => s + r.hotspots_24h, 0) === 0

  if (filtering && filtered.length === 0) {
    return (
      <div className="space-y-6 p-4">
        <header className="space-y-1">
          <Brand compact />
          <h1 className="text-ink truncate text-xl leading-7 font-semibold">
            Pantauan titik panas Indonesia
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
      <div className="space-y-6 p-4">
        <header className="space-y-1">
          <Brand compact />
          <h1 className="text-ink truncate text-xl leading-7 font-semibold">
            Pantauan titik panas Indonesia
          </h1>
          <p className="text-ink-2 text-xs leading-4">
            24 jam terakhir{updatedDate ? ` · Diperbarui ${updatedDate}` : ''}
          </p>
        </header>
        <EmptyState
          icon={ShieldCheck}
          title={copy.empty.noHotspots.title}
          description={copy.empty.noHotspots.description(wilayahLabel)}
        />
      </div>
    )
  }

  // 1. Tampilan Hasil Pencarian
  if (searching) {
    return (
      <div className="space-y-4 p-4">
        <SearchBox mapRef={mapRef} />
        <section className="space-y-2">
          <h2 className="text-ink text-sm font-semibold">Hasil pencarian</h2>
          {filtered.length === 0 ? (
            <p className="text-ink-2 py-4 text-sm">
              Wilayah tidak ditemukan. Coba nama kabupaten/kota lain.
            </p>
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
      </div>
    )
  }

  // 2. Beranda nasional — header + tumpukan kartu hasil sederhana
  if (nationalView) {
    return (
      <div className="flex flex-col gap-4 px-4 py-4">
        <div className="space-y-2">
          <Brand compact />
          <SearchBox mapRef={mapRef} />
        </div>

        <header className="space-y-1">
          <h1 className="text-ink text-xl font-semibold">
            Pantauan titik panas Indonesia
          </h1>
          <p className="text-ink-3 text-xs">
            24 jam terakhir{updatedDate ? ` · Diperbarui ${updatedDate}` : ''}
          </p>
        </header>

        <div className="flex flex-col gap-3">
          <LocationCard regions={regions} />
          <LatestEarthquakeCard />

          <section className="space-y-2">
            <h2 className="text-ink text-sm font-semibold">
              Provinsi dengan titik panas terbanyak
            </h2>
            {daftarPending && !daftar ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="rounded-card h-12 w-full" />
                ))}
              </div>
            ) : topProvinces.length === 0 ? (
              <div className="text-ink-2 flex items-center gap-2 py-2 text-sm">
                <Check className="text-risk-low size-4" strokeWidth={2} aria-hidden />
                <span>Tidak ada titik panas dalam 24 jam terakhir</span>
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
                          trend_7d: agg.trend_7d,
                        },
                      ]
                    : []
                })}
              />
            )}
          </section>
        </div>

        <p className="text-ink-3 text-xs">
          Titik panas belum tentu kebakaran. Bukan peringatan resmi.
        </p>
      </div>
    )
  }

  // 3. Tampilan Panel Provinsi (Provinsi dipilih)
  const provTrend = hotspotTrend(provinceStats?.trend_7d ?? [0, 0, 0, 0, 0, 0, 0])
  const {
    label: trendLabel,
    Icon: TrendIcon,
    colorClass: trendColor,
  } = TREND_UI[provTrend]

  return (
    <div className="flex flex-col">
      {/* 1. Hanya X tutup — tanpa judul ganda / divider di atas nama */}
      <div className="flex justify-end px-2 pt-2">
        <button
          type="button"
          onClick={() => {
            setProvince('Semua')
            if (mapRef?.current) fitIndonesia(mapRef.current, panelOpen, 0)
          }}
          aria-label={copy.panel.closeDetail}
          className={cn(
            'text-ink-2 hover:bg-surface-muted hover:text-ink flex size-10 shrink-0 items-center justify-center rounded-full transition-colors',
            focusRing,
          )}
        >
          <X className="size-5 shrink-0" strokeWidth={1.75} aria-hidden />
        </button>
      </div>

      <div className="space-y-6 px-4 pt-0 pb-6">
        <section className="space-y-3">
          <h1 className="text-ink truncate text-xl font-semibold">{province}</h1>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-baseline gap-2">
              <span className="text-ink font-mono text-3xl font-semibold tabular-nums">
                {formatNumber(provinceStats?.count_24h ?? 0)}
              </span>
              <span className="text-ink-2 text-xs">titik panas · 24 jam</span>
              <InfoTooltip content="Lokasi yang terdeteksi satelit NASA FIRMS memiliki panas permukaan tinggi dalam 24 jam terakhir." />
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Badge
                variant="category"
                category={provinceStats?.risk_category ?? 'rendah'}
              />
              <InfoTooltip content="Tingkat risiko dihitung dari jumlah titik panas 24 jam terakhir di wilayah ini. Ambang diambil dari risk_thresholds." />
            </div>
          </div>

          <div className="text-ink-2 flex items-center gap-2 text-sm">
            <TrendIcon
              className={cn('size-4 shrink-0', trendColor)}
              strokeWidth={2}
              aria-hidden
            />
            <span className="text-ink font-medium">{trendLabel}</span>
            <Sparkline
              data={provinceStats?.trend_7d ?? [0, 0, 0, 0, 0, 0, 0]}
              height={16}
              width={48}
              className="opacity-40"
            />
            <InfoTooltip content="Perbandingan jumlah titik panas selama 7 hari terakhir." />
          </div>

          {updatedDate ? (
            <p className="text-ink-3 text-xs">Diperbarui {updatedDate}</p>
          ) : null}
        </section>

        {/* 3. 10 Kabupaten/kota dengan titik panas terbanyak */}
        <section className="space-y-3">
          <h2 className="text-ink text-sm font-semibold">
            Kabupaten/kota dengan titik panas terbanyak
          </h2>
          {provinceTopRegencies.length === 0 ? (
            <div className="text-ink-2 flex items-center gap-2 py-3 text-sm">
              <Check className="text-risk-low size-4" strokeWidth={2} aria-hidden />
              <span>Tidak ada titik panas dalam 24 jam terakhir</span>
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

        {/* 4. Footer disclaimer tunggal */}
        <footer className="text-ink-2 pt-2 text-xs">
          <p>Titik panas belum tentu kebakaran. Bukan peringatan resmi.</p>
        </footer>
      </div>
    </div>
  )
}

function SummarySkeleton({ nationalView }: { nationalView: boolean }) {
  const rowCount = nationalView ? 5 : 10
  return (
    <div className="flex flex-col gap-6 px-4 py-4" aria-busy>
      <div className="space-y-2">
        <Skeleton className="rounded-ctl h-7 w-28" />
        <Skeleton className="h-12 w-full rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="rounded-ctl h-7 w-3/4" />
        <Skeleton className="rounded-ctl h-4 w-1/2" />
      </div>
      {nationalView ? (
        <div className="space-y-2">
          <Skeleton className="rounded-ctl h-4 w-24" />
          <Skeleton className="rounded-ctl h-10 w-full" />
        </div>
      ) : null}
      <div className="space-y-2">
        <Skeleton className="rounded-ctl h-4 w-1/3" />
        {Array.from({ length: rowCount }).map((_, i) => (
          <Skeleton key={i} className="rounded-ctl h-12 w-full" />
        ))}
      </div>
    </div>
  )
}
