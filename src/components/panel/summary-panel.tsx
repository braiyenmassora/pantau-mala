import { Info } from 'lucide-react'
import type { RefObject } from 'react'
import { useMemo } from 'react'

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
          <h2 className="text-xl leading-7 font-semibold text-ink">{title}</h2>
          <p className="mt-1 text-[13px] leading-[18px] text-ink-2">
            Indikator kebakaran hutan dan lahan
          </p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex h-6 shrink-0 items-center rounded-full bg-brand-soft px-2.5 text-[12px] leading-4 font-semibold text-brand">
              Beta
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            Versi uji coba. Skor risiko masih dikalibrasi.
          </TooltipContent>
        </Tooltip>
      </header>

      <LocationCard regions={regions} mapRef={mapRef} />

      <section className="rounded-card bg-surface-muted p-4">
        <div className="flex items-center gap-1.5">
          <p className="text-[12px] leading-4 font-medium text-ink-2">Titik panas 24 jam</p>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="text-ink-3 hover:text-ink-2"
                aria-label="Penjelasan titik panas"
              >
                <Info className="size-3.5" strokeWidth={2} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              Titik panas: lokasi yang dideteksi satelit lebih panas dari sekitarnya. Belum
              tentu kebakaran.
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="mt-2 flex items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[28px] leading-8 font-semibold tracking-[-0.02em] text-ink">
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
              color="#C2410C"
            />
            <span className="text-[12px] leading-4 text-ink-2">7 hari terakhir</span>
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-[13px] leading-[18px] font-semibold text-ink-2">
          {sectionLabel}
        </h3>
        {list.length === 0 ? (
          <div className="rounded-card bg-surface-muted p-4 text-sm leading-5 text-ink-2">
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
    return <p className="mt-1 text-[13px] leading-[18px] text-ink-2">Baru muncul hari ini</p>
  }

  if (changePercent === 0) {
    return (
      <p className="mt-1 text-[13px] leading-[18px] text-ink-2">Sama dengan kemarin</p>
    )
  }

  if (changePercent == null) return null

  const up = changePercent > 0
  return (
    <p className={cn('mt-1 text-[13px] leading-[18px] text-risk-high-text')}>
      {up ? '▲' : '▼'} {formatPercent(Math.abs(changePercent))} dibanding kemarin
    </p>
  )
}
