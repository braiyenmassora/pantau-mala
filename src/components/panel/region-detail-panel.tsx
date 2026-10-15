import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Check,
  CloudRain,
  Droplets,
  Flame,
  Gauge,
  Satellite,
  Shield,
  Clock,
  Wind,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Badge, InfoRow, SectionLabel, TrendChart } from '@/components/common'
import { focusRing } from '@/components/common/focus-ring'
import { PanelTabs } from '@/components/panel/panel-tabs'
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

/** Ganti teks internal yang bocor ke UI. */
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

/**
 * Panel detail — header status + tab Ringkasan / Detail / Sumber.
 */
export function RegionDetailPanel({ region }: RegionDetailPanelProps) {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const [tab, setTab] = useState('ringkasan')
  const style = RISK_CATEGORIES[region.risk_category]
  const trend = hotspotTrend(region.trend_7d)
  const { label: trendLabel, Icon: TrendIcon } = TREND_UI[trend]
  const stamp = updatedWhen(region)
  const actions = region.actions.slice(0, 2).map(sanitizeAction)
  const quality = region.quality ?? null
  const score = region.score != null ? formatNumber(region.score) : null
  const riskLabel =
    region.risk_category === 'tidak_tersedia' && region.quality === 'stale'
      ? 'Indikator kedaluwarsa'
      : style.label

  useEffect(() => {
    titleRef.current?.focus()
  }, [region.code])

  const unavailable = copy.detail.unavailable

  return (
    <div key={region.code} className="space-y-6">
      <header className="space-y-3">
        <div className="space-y-1">
          <h2
            ref={titleRef}
            tabIndex={-1}
            className={cn(
              'text-ink line-clamp-2 text-xl font-normal outline-none',
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
        </div>

        {/* Status seperti baris rating */}
        <div
          className="flex flex-wrap items-center gap-x-3 gap-y-2"
          aria-label={copy.detail.riskTitle}
        >
          {region.risk_category === 'tidak_tersedia' ? (
            <Badge variant="meta">{riskLabel}</Badge>
          ) : (
            <Badge variant="category" category={region.risk_category} />
          )}
          <p className="text-ink flex items-baseline gap-1.5">
            <span className="font-mono text-3xl font-semibold tabular-nums">
              {formatNumber(region.hotspots_24h)}
            </span>
            <span className="text-ink-2 text-xs">{copy.detail.hotspot24hLabel}</span>
          </p>
          <p
            className="text-ink-2 flex items-center gap-1 text-sm"
            aria-label={copy.detail.trendAria(trendLabel)}
          >
            <TrendIcon className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
            <span>{trendLabel}</span>
          </p>
        </div>

        {stamp ? (
          <p className="text-ink-3 text-xs">{copy.detail.updatedAt(stamp)}</p>
        ) : null}
      </header>

      <PanelTabs
        value={tab}
        onChange={setTab}
        tabs={[
          {
            id: 'ringkasan',
            label: copy.panel.tabSummary,
            panel: (
              <div className="space-y-6">
                <p role="status" className="text-ink-2 text-xs leading-4">
                  {copy.detail.calibrationNote(score, quality)}
                </p>

                {region.summary ? (
                  <p className="text-paragraph text-ink line-clamp-3">{region.summary}</p>
                ) : null}

                <TrendChart values={region.trend_7d} timeZone={region.time_zone} />

                <section>
                  <SectionLabel>{copy.detail.conditions}</SectionLabel>
                  <div className="mt-1">
                    <InfoRow
                      icon={
                        <Droplets
                          className="size-4 animate-water-ripple"
                          strokeWidth={2}
                        />
                      }
                      label={copy.detail.humidity}
                      value={
                        region.weather.humidity == null
                          ? unavailable
                          : `${formatNumber(region.weather.humidity)}%`
                      }
                    />
                    <InfoRow
                      icon={
                        <Wind className="size-4 animate-wind-drift" strokeWidth={2} />
                      }
                      label={copy.detail.wind}
                      value={
                        region.weather.wind_kmh == null
                          ? unavailable
                          : `${formatNumber(region.weather.wind_kmh)} ${copy.detail.windUnit}`
                      }
                    />
                    <InfoRow
                      icon={
                        <CloudRain
                          className="size-4 animate-water-ripple"
                          strokeWidth={2}
                        />
                      }
                      label={copy.detail.dryDays}
                      value={
                        region.weather.dry_days == null
                          ? unavailable
                          : `${formatNumber(region.weather.dry_days)} ${copy.detail.dayUnit}`
                      }
                    />
                    <InfoRow
                      icon={<Gauge className="size-4" strokeWidth={2} />}
                      label={copy.detail.weatherDanger}
                      value={
                        region.weather_danger
                          ? `${copy.bahaya[region.weather_danger.class]} · ${copy.detail.fwiUnit} ${formatNumber(region.weather_danger.fwi)}`
                          : unavailable
                      }
                    />
                  </div>
                </section>

                {actions.length > 0 ? (
                  <section className="space-y-2">
                    <SectionLabel>{copy.detail.actions}</SectionLabel>
                    <ul className="space-y-2">
                      {actions.map((item) => (
                        <li key={item} className="flex items-start gap-3">
                          <span className="mt-0.5 flex w-6 shrink-0 justify-center" aria-hidden>
                            <Check className="text-brand size-4" strokeWidth={2} />
                          </span>
                          <span className="text-ink text-base">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
              </div>
            ),
          },
          {
            id: 'detail',
            label: copy.panel.tabDetail,
            panel: (
              <div className="space-y-6">
                {region.last_detection ? (
                  <section>
                    <SectionLabel>{copy.extra.detection}</SectionLabel>
                    <div className="mt-1">
                      <InfoRow
                        icon={<Satellite className="size-4" strokeWidth={2} />}
                        label={copy.extra.satellite}
                        value={region.last_detection.satellite}
                      />
                      <InfoRow
                        icon={<Shield className="size-4" strokeWidth={2} />}
                        label={copy.extra.confidence}
                        value={confidenceLabel(region.last_detection.confidence)}
                      />
                      <InfoRow
                        icon={<Flame className="size-4" strokeWidth={2} />}
                        label={copy.extra.frp}
                        value={
                          <span className="font-mono tabular-nums">
                            {formatNumber(region.last_detection.frp_mw)} MW
                          </span>
                        }
                      />
                    </div>
                  </section>
                ) : null}

                <section className="space-y-2">
                  <SectionLabel>{copy.extra.river}</SectionLabel>
                  <RegionRiverPanel code={region.code} embedded />
                </section>
              </div>
            ),
          },
          {
            id: 'sumber',
            label: copy.panel.tabSources,
            panel: (
              <div>
                <InfoRow
                  icon={<Clock className="size-4" strokeWidth={2} />}
                  label={copy.extra.computedAt}
                  value={
                    region.computed_at
                      ? formatDateTime(region.computed_at, region.time_zone)
                      : copy.extra.noTimestamp
                  }
                />
                <InfoRow
                  icon={<Clock className="size-4" strokeWidth={2} />}
                  label={copy.extra.weatherAt}
                  value={
                    region.weather_updated_at
                      ? formatDateTime(region.weather_updated_at, region.time_zone)
                      : copy.extra.noTimestamp
                  }
                />
                <InfoRow
                  icon={<Clock className="size-4" strokeWidth={2} />}
                  label={copy.extra.airAt}
                  value={
                    region.air_updated_at
                      ? formatDateTime(region.air_updated_at, region.time_zone)
                      : copy.extra.noTimestamp
                  }
                />
              </div>
            ),
          },
        ]}
      />
    </div>
  )
}
