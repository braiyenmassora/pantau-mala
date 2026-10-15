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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-1">
          <p className="text-ink-2 text-xs leading-5">{label}</p>
          {tooltip ? <InfoTooltip content={tooltip} className="size-4" /> : null}
        </div>
        <p
          className={cn(
            'text-base leading-6',
            isMissing ? 'text-ink-3 font-normal' : 'text-ink font-semibold tabular-nums',
          )}
        >
          {value}
        </p>
      </div>
    </div>
  )
}

// ponytail: detail = kartu konsisten + TrendChart 7 hari dari develop.
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
      <div className="flex justify-end px-2 pt-2">
        <button
          type="button"
          onClick={handleBack}
          aria-label={copy.panel.closeDetail}
          className={cn(
            'text-ink-2 hover:bg-surface-muted hover:text-ink rounded-ctl flex size-8 shrink-0 items-center justify-center transition-colors',
            focusRing,
          )}
        >
          <X className="size-5 shrink-0" strokeWidth={1.75} aria-hidden />
        </button>
      </div>

      <div className="flex flex-col gap-4 px-4 pt-0 pb-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-1">
              <h2
                ref={titleRef}
                tabIndex={-1}
                className="text-ink truncate text-xl leading-7 font-semibold outline-none"
                title={region.name}
              >
                {region.name}
              </h2>
              <InfoTooltip content={copy.panel.limitationNote} />
            </div>
            <p className="text-ink-2 text-xs leading-5">Provinsi {region.province}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-baseline gap-2">
                <span className="text-ink font-mono text-3xl font-semibold tabular-nums">
                  {formatNumber(region.hotspots_24h)}
                </span>
                <span className="text-ink-2 text-xs leading-5">titik panas · 24 jam</span>
                <InfoTooltip content="Lokasi yang terdeteksi satelit NASA FIRMS memiliki panas permukaan tinggi dalam 24 jam terakhir." />
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Badge variant="category" category={region.risk_category} />
                <InfoTooltip content="Tingkat risiko dihitung dari jumlah titik panas 24 jam terakhir di wilayah ini. Ambang diambil dari risk_thresholds." />
              </div>
            </div>

            <div className="text-ink-2 flex items-center gap-2 text-sm leading-5">
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

            {stamp ? (
              <p className="text-ink-2 text-xs leading-5">Diperbarui {stamp}</p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kondisi saat ini</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <ConditionCell
                icon={<Droplets strokeWidth={2} />}
                label="Kelembapan"
                value={
                  region.weather.humidity != null
                    ? `${formatNumber(region.weather.humidity)}%`
                    : '—'
                }
                isMissing={region.weather.humidity == null}
              />
              <ConditionCell
                icon={<Wind strokeWidth={2} />}
                label="Kecepatan angin"
                value={
                  region.weather.wind_kmh != null
                    ? `${formatNumber(region.weather.wind_kmh)} km/jam`
                    : '—'
                }
                isMissing={region.weather.wind_kmh == null}
              />
              <ConditionCell
                icon={<Sun strokeWidth={2} />}
                label="Hari tanpa hujan"
                value={
                  region.weather.dry_days != null
                    ? `${formatNumber(region.weather.dry_days)} hari`
                    : '—'
                }
                isMissing={region.weather.dry_days == null}
              />
              <ConditionCell
                icon={<Gauge strokeWidth={2} />}
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Yang bisa kamu lakukan</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {actions.map((act, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check
                    className="text-risk-low mt-1 size-4 shrink-0"
                    strokeWidth={2}
                    aria-hidden
                  />
                  <span className="text-ink text-sm leading-6">
                    <ActionText text={act} />
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
