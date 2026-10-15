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

import { Badge, InfoTooltip, TrendChart } from '@/components/common'
import { focusRing } from '@/components/common/focus-ring'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { MapRef } from '@/components/ui/map'
import { copy } from '@/copy/id'
import type { Region, RiskCategory } from '@/data/types'
import { restoreFocusTrigger } from '@/lib/focus-return'
import { formatNumber } from '@/lib/format'
import { hotspotTrend, type TrendDirection } from '@/lib/hotspot-trend'
import { fitIndonesia } from '@/lib/indonesia-view'
import { effectiveRiskCategory } from '@/lib/risk-rule'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

type RegionDetailPanelProps = {
  region: Region
  mapRef?: RefObject<MapRef | null>
}

const TREND_UI: Record<TrendDirection, { label: string; Icon: typeof TrendingUp }> = {
  naik: { label: copy.detail.trendUp, Icon: TrendingUp },
  turun: { label: copy.detail.trendDown, Icon: TrendingDown },
  stabil: { label: copy.detail.trendFlat, Icon: Minus },
}

function chartTone(risk: RiskCategory): 'chart' | 'risk-high' | 'risk-mid' | 'risk-low' {
  if (risk === 'sangat_tinggi') return 'risk-high'
  if (risk === 'sedang') return 'risk-mid'
  if (risk === 'rendah') return 'risk-low'
  return 'chart'
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
  const parts = text.split(/(112|113)/g)
  return (
    <>
      {parts.map((part, i) =>
        part === '112' || part === '113' ? (
          <a
            key={i}
            href={`tel:${part}`}
            className="text-risk-low font-semibold underline underline-offset-2 hover:opacity-80"
          >
            {part}
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
}: {
  icon: ReactNode
  label: string
  value: ReactNode | null
  isMissing?: boolean
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-ink-2 mt-0.5 shrink-0 [&>svg]:size-4" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-1">
          <p className="text-ink-2 text-xs leading-4">{label}</p>
          {isMissing ? (
            <InfoTooltip content={copy.detail.weatherMissingTip} className="size-4" />
          ) : null}
        </div>
        <p
          className={cn(
            'text-sm leading-5',
            isMissing ? 'text-ink-2 font-normal' : 'text-ink font-semibold tabular-nums',
          )}
        >
          {isMissing ? copy.detail.unavailable : value}
        </p>
      </div>
    </div>
  )
}

/** Detail wilayah — pola kartu sama beranda/provinsi (atas hanya X). */
export function RegionDetailPanel({ region, mapRef }: RegionDetailPanelProps) {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const select = useMapStore((s) => s.select)
  const province = useMapStore((s) => s.province)
  const panelOpen = useUiStore((s) => s.panelOpen)

  const risk = effectiveRiskCategory(region)
  const trend = hotspotTrend(region.trend_7d)
  const { label: trendLabel, Icon: TrendIcon } = TREND_UI[trend]
  const actions =
    region.actions.length > 0
      ? region.actions.slice(0, 3).map(sanitizeAction)
      : ['Pantau perkembangan titik panas dan arah angin.', copy.detail.actionFireContact]

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
      <div className="bg-surface sticky top-0 z-10 flex justify-end px-4 pt-3 pb-1">
        <button
          type="button"
          onClick={handleBack}
          aria-label={copy.panel.closeDetail}
          className={cn(
            'text-ink-2 hover:bg-surface-muted rounded-ctl flex size-11 shrink-0 items-center justify-center transition-colors',
            focusRing,
          )}
        >
          <X className="size-4 shrink-0" strokeWidth={2} aria-hidden />
        </button>
      </div>

      <div className="flex flex-col gap-5 px-4 pt-1 pb-5">
        <Card aria-label={region.name}>
          <CardHeader>
            <div className="flex min-w-0 items-center gap-1">
              <h2
                ref={titleRef}
                tabIndex={-1}
                className="text-ink min-w-0 truncate text-sm leading-5 font-semibold outline-none"
                title={region.name}
              >
                {region.name}
              </h2>
              <InfoTooltip content={copy.detail.riskTooltip} />
            </div>
            <Badge variant="category" category={risk} />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-0.5">
                <p className="text-ink font-mono text-2xl leading-8 font-semibold tabular-nums">
                  {formatNumber(region.hotspots_24h)}
                </p>
                <p className="text-ink text-sm leading-5">
                  {copy.detail.hotspotUnitLine}
                </p>
              </div>
              <div className="text-ink-2 space-y-1 text-xs leading-4">
                <p>{copy.map.regionMetaProvince(region.province)}</p>
                <p className="flex items-center gap-1.5">
                  <TrendIcon className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
                  <span>
                    {trendLabel} {copy.detail.trendVsPrevious}
                  </span>
                </p>
              </div>
            </div>

            <TrendChart
              values={region.trend_7d}
              timeZone={region.time_zone}
              tone={chartTone(risk)}
              description={null}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-1">
              <CardTitle>{copy.detail.conditions}</CardTitle>
              <InfoTooltip content={copy.detail.weatherSourceNote} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <ConditionCell
                icon={<Droplets strokeWidth={2} />}
                label={copy.detail.humidity}
                value={
                  region.weather.humidity != null
                    ? `${formatNumber(region.weather.humidity)}%`
                    : null
                }
                isMissing={region.weather.humidity == null}
              />
              <ConditionCell
                icon={<Wind strokeWidth={2} />}
                label={copy.detail.wind}
                value={
                  region.weather.wind_kmh != null
                    ? `${formatNumber(region.weather.wind_kmh)} ${copy.detail.windUnit}`
                    : null
                }
                isMissing={region.weather.wind_kmh == null}
              />
              <ConditionCell
                icon={<Sun strokeWidth={2} />}
                label={copy.detail.dryDays}
                value={
                  region.weather.dry_days != null
                    ? `${formatNumber(region.weather.dry_days)} ${copy.detail.dayUnit}`
                    : null
                }
                isMissing={region.weather.dry_days == null}
              />
              <ConditionCell
                icon={<Gauge strokeWidth={2} />}
                label={copy.detail.weatherDanger}
                value={
                  region.weather_danger
                    ? `${copy.bahaya[region.weather_danger.class]} (${formatNumber(region.weather_danger.fwi)})`
                    : null
                }
                isMissing={!region.weather_danger}
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
