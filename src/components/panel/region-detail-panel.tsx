import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Check,
  CloudRain,
  Droplets,
  Gauge,
  Wind,
} from 'lucide-react'
import { useEffect, useRef } from 'react'

import { Badge, DataTile, HintButton, SectionLabel } from '@/components/common'
import { focusRing } from '@/components/common/focus-ring'
import { DetailAccordion } from '@/components/panel/detail-accordion'
import { RegionRiverPanel } from '@/components/panel/region-river-panel'
import type { ConfidenceLevel, Region } from '@/data/types'
import { copy } from '@/copy/id'
import { formatDateTime, formatNumber } from '@/lib/format'
import { hotspotTrend, type TrendDirection } from '@/lib/hotspot-trend'
import { RISK_CATEGORIES } from '@/lib/risk-category'
import { cn } from '@/lib/utils'

type RegionDetailPanelProps = {
  region: Region
}

const TREND_UI: Record<
  TrendDirection,
  { label: string; Icon: typeof ArrowUp }
> = {
  naik: { label: copy.detail.trendUp, Icon: ArrowUp },
  turun: { label: copy.detail.trendDown, Icon: ArrowDown },
  stabil: { label: copy.detail.trendFlat, Icon: ArrowRight },
}

function updatedWhen(region: Region): string | null {
  const iso =
    region.computed_at ?? region.weather_updated_at ?? region.last_detection?.time ?? null
  if (!iso) return null
  return formatDateTime(iso, region.time_zone)
}

function confidenceLabel(level: ConfidenceLevel): string {
  return copy.detail.confidence[level]
}

/**
 * Panel detail wilayah — hierarki ala Maps:
 * header → status → catatan → waktu → ringkasan → kondisi → aksi → accordion.
 */
export function RegionDetailPanel({ region }: RegionDetailPanelProps) {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const style = RISK_CATEGORIES[region.risk_category]
  const trend = hotspotTrend(region.trend_7d)
  const { label: trendLabel, Icon: TrendIcon } = TREND_UI[trend]
  const stamp = updatedWhen(region)
  const actions = region.actions.slice(0, 2)
  const quality = region.quality ?? null
  const score =
    region.score != null ? formatNumber(region.score) : null
  const riskLabel =
    region.risk_category === 'tidak_tersedia' && region.quality === 'stale'
      ? 'Indikator kedaluwarsa'
      : style.label

  useEffect(() => {
    titleRef.current?.focus()
  }, [region.code])

  return (
    <div key={region.code} className="space-y-6">
      {/* 1. Header */}
      <header className="space-y-1">
        <h2
          ref={titleRef}
          tabIndex={-1}
          className={cn(
            'text-ink line-clamp-2 text-xl font-semibold outline-none',
            focusRing,
            'rounded-ctl',
          )}
          title={region.name}
        >
          {region.name}
        </h2>
        <p className="text-ink-2 text-sm">
          {copy.map.regionMetaProvince(region.province)}
        </p>
      </header>

      {/* 2. Status utama */}
      <section className="space-y-3" aria-label={copy.detail.riskTitle}>
        <div className="flex flex-wrap items-center gap-2">
          {region.risk_category === 'tidak_tersedia' ? (
            <Badge variant="meta">{riskLabel}</Badge>
          ) : (
            <Badge variant="category" category={region.risk_category} />
          )}
          <HintButton
            ariaLabel={copy.detail.riskHint}
            text={copy.detail.riskTooltip}
          />
        </div>
        <div>
          <p className="text-ink font-mono text-3xl font-semibold tabular-nums">
            {formatNumber(region.hotspots_24h)}
          </p>
          <p className="text-ink-2 mt-1 text-xs">{copy.detail.hotspot24hLabel}</p>
        </div>
        <p
          className="text-ink-2 flex items-center gap-1.5 text-sm"
          aria-label={copy.detail.trendAria(trendLabel)}
        >
          <TrendIcon className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
          <span>{trendLabel}</span>
        </p>
      </section>

      {/* 3. Catatan keterbatasan */}
      <p role="status" className="text-ink-2 text-xs leading-4">
        {copy.detail.calibrationNote(score, quality)}
      </p>

      {/* 4. Waktu pembaruan */}
      {stamp ? (
        <p className="text-ink-3 text-xs">{copy.detail.updatedAt(stamp)}</p>
      ) : null}

      {/* 5. Ringkasan */}
      {region.summary ? (
        <section className="space-y-2">
          <SectionLabel>{copy.detail.summary}</SectionLabel>
          <p className="text-paragraph text-ink line-clamp-3">{region.summary}</p>
        </section>
      ) : null}

      {/* 6. Kondisi saat ini — 4 kotak sama */}
      <section className="space-y-2">
        <SectionLabel>{copy.detail.conditions}</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          <DataTile
            icon={
              <Droplets
                className="text-ink-2 size-3.5 animate-water-ripple"
                strokeWidth={2}
              />
            }
            label={copy.detail.humidity}
            value={
              region.weather.humidity == null
                ? copy.detail.unavailable
                : `${formatNumber(region.weather.humidity)}%`
            }
          />
          <DataTile
            icon={
              <Wind
                className="text-ink-2 size-3.5 animate-wind-drift"
                strokeWidth={2}
              />
            }
            label={copy.detail.wind}
            value={
              region.weather.wind_kmh == null
                ? copy.detail.unavailable
                : `${formatNumber(region.weather.wind_kmh)} ${copy.detail.windUnit}`
            }
          />
          <DataTile
            icon={
              <CloudRain
                className="text-ink-2 size-3.5 animate-water-ripple"
                strokeWidth={2}
              />
            }
            label={copy.detail.dryDays}
            value={
              region.weather.dry_days == null
                ? copy.detail.unavailable
                : `${formatNumber(region.weather.dry_days)} ${copy.detail.dayUnit}`
            }
          />
          <DataTile
            icon={<Gauge className="text-ink-2 size-3.5" strokeWidth={2} />}
            label={copy.detail.weatherDanger}
            value={
              region.weather_danger
                ? copy.bahaya[region.weather_danger.class]
                : copy.detail.unavailable
            }
            unit={
              region.weather_danger
                ? `${copy.detail.fwiUnit} ${formatNumber(region.weather_danger.fwi)}`
                : undefined
            }
            hintAria={copy.detail.weatherDangerHint}
            hintText={copy.detail.weatherDangerTooltip}
          />
        </div>
      </section>

      {/* 7. Yang bisa kamu lakukan */}
      {actions.length > 0 ? (
        <section className="space-y-2">
          <SectionLabel>{copy.detail.actions}</SectionLabel>
          <ul className="rounded-card bg-surface-muted space-y-2 p-4">
            {actions.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Check
                  className="text-brand mt-0.5 size-4 shrink-0"
                  strokeWidth={2}
                  aria-hidden
                />
                <span className="text-ink text-base">{item}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* 8–10. Accordion */}
      <div className="space-y-2">
        {region.last_detection ? (
          <DetailAccordion title={copy.extra.detection}>
            <dl className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
              <div>
                <dt className="text-ink-2 font-medium">{copy.extra.satellite}</dt>
                <dd className="text-ink mt-0.5 font-semibold">
                  {region.last_detection.satellite}
                </dd>
              </div>
              <div>
                <dt className="text-ink-2 font-medium">{copy.extra.confidence}</dt>
                <dd className="text-ink mt-0.5 font-semibold">
                  {confidenceLabel(region.last_detection.confidence)}
                </dd>
              </div>
              <div>
                <dt className="text-ink-2 font-medium">{copy.extra.frp}</dt>
                <dd className="text-ink mt-0.5 font-mono font-semibold tabular-nums">
                  {formatNumber(region.last_detection.frp_mw)} MW
                </dd>
              </div>
            </dl>
          </DetailAccordion>
        ) : null}

        <RegionRiverPanel key={region.code} code={region.code} />

        <DetailAccordion title={copy.extra.sourcesUpdates}>
          <ul className="text-ink-2 space-y-1.5 text-xs">
            <li>
              {copy.extra.computedAt}:{' '}
              {region.computed_at
                ? formatDateTime(region.computed_at, region.time_zone)
                : copy.extra.noTimestamp}
            </li>
            <li>
              {copy.extra.weatherAt}:{' '}
              {region.weather_updated_at
                ? formatDateTime(region.weather_updated_at, region.time_zone)
                : copy.extra.noTimestamp}
            </li>
            <li>
              {copy.extra.airAt}:{' '}
              {region.air_updated_at
                ? formatDateTime(region.air_updated_at, region.time_zone)
                : copy.extra.noTimestamp}
            </li>
          </ul>
        </DetailAccordion>
      </div>
    </div>
  )
}
