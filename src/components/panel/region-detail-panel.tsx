import {
  Check,
  Droplets,
  Gauge,
  Minus,
  Sun,
  TrendingDown,
  TrendingUp,
  Wind,
  X,
} from 'lucide-react'
import { useEffect, useRef, type ReactNode, type RefObject } from 'react'

import { Badge, InfoTooltip, Sparkline, TrendChart } from '@/components/common'
import { focusRing } from '@/components/common/focus-ring'
import type { MapRef } from '@/components/ui/map'
import { copy } from '@/copy/id'
import type { Region } from '@/data/types'
import { restoreFocusTrigger } from '@/lib/focus-return'
import { formatDateTime, formatNumber } from '@/lib/format'
import { hotspotTrend, type TrendDirection } from '@/lib/hotspot-trend'
import { fitIndonesia } from '@/lib/indonesia-view'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

type RegionDetailPanelProps = {
  region: Region
  mapRef?: RefObject<MapRef | null>
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

function updatedWhen(region: Region): string | null {
  const iso =
    region.computed_at ?? region.weather_updated_at ?? region.last_detection?.time ?? null
  if (!iso) return null
  return formatDateTime(iso, region.time_zone)
}

function sanitizeAction(text: string): string {
  const lower = text.toLowerCase()
  if (
    lower.includes('verifikasi ketersediaan nomor') ||
    lower.includes('tampilkan atribusi')
  ) {
    return copy.detail.actionFireContact
  }
  return text
}

function ActionText({ text }: { text: string }) {
  const parts = text.split(/(113)/g)
  return (
    <>
      {parts.map((part, i) =>
        part === '113' ? (
          <a
            key={i}
            href="tel:113"
            className="text-risk-low font-semibold underline underline-offset-2 hover:opacity-80"
          >
            113
          </a>
        ) : (
          part
        ),
      )}
    </>
  )
}

function ConditionCell({
  icon,
  label,
  value,
  isMissing = false,
  tooltip,
}: {
  icon: ReactNode
  label: string
  value: ReactNode
  isMissing?: boolean
  tooltip?: string
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-ink-2 mt-1 shrink-0 [&>svg]:size-5" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <p className="text-ink-2 text-xs leading-4">{label}</p>
          {tooltip ? <InfoTooltip content={tooltip} className="size-4" /> : null}
        </div>
        <p
          className={cn(
            'mt-1 text-base leading-5',
            isMissing ? 'text-ink-3 font-normal' : 'text-ink font-semibold tabular-nums',
          )}
        >
          {value}
        </p>
      </div>
    </div>
  )
}

// ponytail: panel detail satu scroll tanpa tab, tanpa divider, spacing 24px/12px/8px.
export function RegionDetailPanel({ region, mapRef }: RegionDetailPanelProps) {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const select = useMapStore((s) => s.select)
  const province = useMapStore((s) => s.province)
  const panelOpen = useUiStore((s) => s.panelOpen)

  const trend = hotspotTrend(region.trend_7d)
  const { label: trendLabel, Icon: TrendIcon, colorClass } = TREND_UI[trend]
  const stamp = updatedWhen(region)
  const actions =
    region.actions.length > 0
      ? region.actions.slice(0, 3).map(sanitizeAction)
      : [
          'Pantau perkembangan titik panas dan arah angin.',
          'Hubungi Damkar di 113 bila melihat kebakaran lahan.',
        ]

  useEffect(() => {
    titleRef.current?.focus()
  }, [region.code])

  function handleBack() {
    select(null)
    restoreFocusTrigger()
    if (mapRef?.current && province === 'Semua') {
      fitIndonesia(mapRef.current, panelOpen, 0)
    }
  }

  return (
    <div key={region.code} className="flex flex-col">
      {/* 1. Hanya X tutup — tanpa judul ganda / divider */}
      <div className="flex justify-end px-2 pt-2">
        <button
          type="button"
          onClick={handleBack}
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
          <div>
            <h2
              ref={titleRef}
              tabIndex={-1}
              className="text-ink truncate text-xl font-semibold outline-none"
              title={region.name}
            >
              {region.name}
            </h2>
            <p className="text-ink-2 mt-1 text-xs leading-4">
              Provinsi {region.province}
            </p>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-baseline gap-2">
              <span className="text-ink font-mono text-3xl font-semibold tabular-nums">
                {formatNumber(region.hotspots_24h)}
              </span>
              <span className="text-ink-2 text-xs">titik panas · 24 jam</span>
              <InfoTooltip content="Lokasi yang terdeteksi satelit NASA FIRMS memiliki panas permukaan tinggi dalam 24 jam terakhir." />
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Badge variant="category" category={region.risk_category} />
              <InfoTooltip content="Tingkat risiko dihitung dari jumlah titik panas 24 jam terakhir di wilayah ini. Ambang diambil dari risk_thresholds." />
            </div>
          </div>

          <div className="text-ink-2 flex items-center gap-2 text-sm">
            <TrendIcon
              className={cn('size-4 shrink-0', colorClass)}
              strokeWidth={2}
              aria-hidden
            />
            <span className="text-ink font-medium">{trendLabel}</span>
            <Sparkline
              data={region.trend_7d}
              height={16}
              width={48}
              className="opacity-40"
            />
            <InfoTooltip content="Perbandingan jumlah titik panas selama 7 hari terakhir." />
          </div>

          <TrendChart values={region.trend_7d} timeZone={region.time_zone} />

          {stamp ? <p className="text-ink-3 text-xs">Diperbarui {stamp}</p> : null}
        </section>

        {/* 3. Kondisi saat ini */}
        <section className="space-y-3">
          <h3 className="text-ink text-sm font-semibold">Kondisi saat ini</h3>
          <div className="grid grid-cols-2 gap-4">
            <ConditionCell
              icon={<Droplets strokeWidth={1.75} />}
              label="Kelembapan"
              value={
                region.weather.humidity != null
                  ? `${formatNumber(region.weather.humidity)}%`
                  : '—'
              }
              isMissing={region.weather.humidity == null}
            />
            <ConditionCell
              icon={<Wind strokeWidth={1.75} />}
              label="Kecepatan angin"
              value={
                region.weather.wind_kmh != null
                  ? `${formatNumber(region.weather.wind_kmh)} km/jam`
                  : '—'
              }
              isMissing={region.weather.wind_kmh == null}
            />
            <ConditionCell
              icon={<Sun strokeWidth={1.75} />}
              label="Hari tanpa hujan"
              value={
                region.weather.dry_days != null
                  ? `${formatNumber(region.weather.dry_days)} hari`
                  : '—'
              }
              isMissing={region.weather.dry_days == null}
            />
            <ConditionCell
              icon={<Gauge strokeWidth={1.75} />}
              label="Kelas FWI"
              value={
                region.weather_danger
                  ? `${copy.bahaya[region.weather_danger.class]} (${formatNumber(region.weather_danger.fwi)})`
                  : '—'
              }
              isMissing={!region.weather_danger}
              tooltip="Fire Weather Index: ukuran seberapa mudah api menyala dan menyebar berdasarkan cuaca. Makin tinggi kelasnya, makin rawan."
            />
          </div>
        </section>

        {/* 4. Yang bisa kamu lakukan */}
        <section className="space-y-3">
          <h3 className="text-ink text-sm font-semibold">Yang bisa kamu lakukan</h3>
          <ul className="space-y-2">
            {actions.map((act, i) => (
              <li key={i} className="flex items-start gap-2">
                <Check
                  className="text-risk-low mt-1 size-4 shrink-0"
                  strokeWidth={2}
                  aria-hidden
                />
                <span className="text-ink text-sm leading-5">
                  <ActionText text={act} />
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* 5. Disclaimer tunggal */}
        <footer className="text-ink-2 pt-2 text-xs">
          <p>Titik panas belum tentu kebakaran. Bukan peringatan resmi.</p>
        </footer>
      </div>
    </div>
  )
}
