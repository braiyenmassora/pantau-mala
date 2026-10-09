import { Info } from 'lucide-react'
import type { RefObject } from 'react'
import { useMemo } from 'react'

import { Badge, SectionLabel } from '@/components/common'
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
import type { Region } from '@/data/types'
import { formatNumber, formatPercent } from '@/lib/format'
import { RISK_CATEGORIES } from '@/lib/risk-category'
import { computeSummary } from '@/lib/summary'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'

type SummaryPanelProps = {
  regions: Region[]
  filtered: Region[]
  mapRef: RefObject<MapRef | null>
  isPending: boolean
  isError: boolean
}

export function SummaryPanel({
  regions,
  filtered,
  mapRef,
  isPending,
  isError,
}: SummaryPanelProps) {
  const province = useMapStore((s) => s.province)
  const query = useMapStore((s) => s.query)
  const selectedCode = useMapStore((s) => s.selectedCode)

  const selected = useMemo(
    () => regions.find((r) => r.kode === selectedCode) ?? null,
    [regions, selectedCode],
  )

  if (isPending) {
    return <p className="animate-view-in text-sm text-ink-2">Memuat data wilayah…</p>
  }
  if (isError) {
    return (
      <p className="animate-view-in text-sm text-risk-high-text">
        Gagal memuat data wilayah.
      </p>
    )
  }

  if (selected) {
    return <RegionDetailPanel region={selected} />
  }

  const title =
    province === 'Semua' ? 'Indonesia hari ini' : `${province} hari ini`
  const searching = query.trim().length > 0
  const list = searching ? filtered : filtered.slice(0, 5)
  const sectionLabel = searching ? 'Hasil pencarian' : 'Wilayah risiko tertinggi'
  const summary = computeSummary(filtered)

  return (
    <div key={`summary-${province}-${query}`} className="animate-view-in space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-ink">{title}</h2>
          <p className="mt-1 text-sm text-ink-2">Indikator kebakaran hutan dan lahan</p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Badge variant="beta" />
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="rounded-ctl">
            Versi uji coba. Skor risiko masih dikalibrasi.
          </TooltipContent>
        </Tooltip>
      </header>

      <LocationCard regions={regions} />

      <section className="rounded-card bg-surface-muted p-4">
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium text-ink-2">Titik panas 24 jam</p>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className={cn('text-ink-3 transition-colors duration-150 ease-in-out hover:text-ink-2', focusRing, 'rounded-ctl')}
                aria-label="Penjelasan titik panas"
              >
                <Info className="size-3.5" strokeWidth={2} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs rounded-ctl">
              Titik panas: lokasi yang dideteksi satelit lebih panas dari sekitarnya. Belum
              tentu kebakaran.
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
            <span className="text-xs text-ink-2">7 hari terakhir</span>
          </div>
        </div>
      </section>

      <section>
        <SectionLabel className="mb-2">{sectionLabel}</SectionLabel>
        {list.length === 0 ? (
          <div className="rounded-card bg-surface-muted p-4 text-sm text-ink-2">
            Lokasi tidak ditemukan. Coba nama kabupaten/kota lain.
          </div>
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
    return <p className="mt-1 text-sm text-ink-2">Baru muncul hari ini</p>
  }

  if (changePercent === 0) {
    return <p className="mt-1 text-sm text-ink-2">Sama dengan kemarin</p>
  }

  if (changePercent == null) return null

  const up = changePercent > 0
  return (
    <p className="mt-1 text-sm text-risk-high-text">
      {up ? '▲' : '▼'} {formatPercent(Math.abs(changePercent))} dibanding kemarin
    </p>
  )
}
