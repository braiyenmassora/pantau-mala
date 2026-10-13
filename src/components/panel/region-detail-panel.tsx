import { RegionHistoryPanel } from './region-history-panel'
import {
  Check,
  Clock,
  Cloud,
  CloudFog,
  CloudRain,
  Droplets,
  Radar,
  Gauge,
  MapPin,
  Wind,
} from 'lucide-react'
import { useEffect, useRef } from 'react'

import { DataTile, HintButton, SectionLabel } from '@/components/common'
import { focusRing } from '@/components/common/focus-ring'
import type { Region } from '@/data/types'
import { copy } from '@/copy/id'
import { formatDetectionDate } from '@/lib/detection-flag'
import { formatNumber, formatDateTime } from '@/lib/format'
import { RISK_CATEGORIES } from '@/lib/risk-category'
import { cn } from '@/lib/utils'

type RegionDetailPanelProps = {
  region: Region
}

export function RegionDetailPanel({ region }: RegionDetailPanelProps) {
  const titleRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    titleRef.current?.focus()
  }, [region.code])

  return (
    <div key={region.code} className="animate-view-in space-y-4">
      <div className="space-y-4">
        <header>
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
          <p className="text-ink-2 mt-1 flex items-center gap-1 text-sm">
            <MapPin className="text-ink-2 size-4 shrink-0" strokeWidth={2} aria-hidden />
            <span>{copy.map.regionMetaProvince(region.province)}</span>
          </p>
          {region.last_detection ? (
            <p className="text-ink-2 mt-1 flex items-center gap-1 text-sm">
              <Clock className="text-ink-2 size-4 shrink-0" strokeWidth={2} aria-hidden />
              <span>
                {copy.detail.flagDate}{' '}
                {formatDetectionDate(region.last_detection.time, region.time_zone)}
              </span>
            </p>
          ) : null}
        </header>
        <RiskCard region={region} />
        <DataTile
          label={copy.extra.score}
          value={formatNumber(region.score ?? null)}
          unit={copy.extra.provisional}
        />
        {region.quality && region.quality !== 'ok' && (
          <p role="status" className="text-ink-2 text-sm">
            Indikator {region.quality === 'stale' ? 'kedaluwarsa' : 'belum lengkap'};
            bukan peringatan resmi.
          </p>
        )}
      </div>

      <section className="space-y-2">
        <SectionLabel>{copy.detail.summary}</SectionLabel>
        <p className="text-paragraph text-ink">{region.summary}</p>
      </section>

      <section className="space-y-2">
        <SectionLabel>{copy.detail.actions}</SectionLabel>
        <div className="rounded-card bg-surface-muted p-4">
          <ul className="space-y-2">
            {region.actions.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Check
                  className="text-brand mt-1 size-4 shrink-0"
                  strokeWidth={2}
                  aria-hidden
                />
                <span className="text-ink text-base">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {region.last_detection && (
        <section className="space-y-2">
          <SectionLabel>{copy.extra.detection}</SectionLabel>
          <div className="grid grid-cols-2 gap-2">
            <DataTile
              label={copy.extra.satellite}
              value={region.last_detection.satellite}
            />
            <DataTile
              label={copy.extra.confidence}
              value={region.last_detection.confidence}
            />
            <DataTile
              label={copy.extra.frp}
              value={formatNumber(region.last_detection.frp_mw)}
              unit="MW"
            />
          </div>
        </section>
      )}
      <section className="space-y-2">
        <SectionLabel>{copy.extra.freshness}</SectionLabel>
        {[
          [copy.extra.computedAt, region.computed_at],
          [copy.extra.weatherAt, region.weather_updated_at],
          [copy.extra.airAt, region.air_updated_at],
        ].map(([label, time]) => (
          <p key={label} className="text-ink-2 text-xs">
            {label}:{' '}
            {time ? formatDateTime(time, region.time_zone) : copy.extra.noTimestamp}
          </p>
        ))}
      </section>
      <RegionHistoryPanel key={region.code} code={region.code} />
      <section className="space-y-2">
        <SectionLabel>{copy.detail.conditions}</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          {/* Risiko pin = FIRMS saja; FWI/udara terpisah di sini. */}
          <DataTile
            icon={<Cloud className="text-ink-2 size-4" strokeWidth={2} />}
            label={copy.source.cuaca}
            value={`${formatNumber(region.weather.temp_c)}°C`}
            unit={region.weather.condition}
          />
          <DataTile
            icon={<CloudFog className="text-ink-2 size-4" strokeWidth={2} />}
            label={copy.detail.airQuality}
            value={copy.air[region.air_quality.category]}
            unit={`PM2.5 ${formatNumber(region.air_quality.pm25)}`}
            valueClassName={
              region.air_quality.category === 'tidak_sehat'
                ? 'text-risk-high-text'
                : region.air_quality.category === 'sedang'
                  ? 'text-risk-mid-text'
                  : undefined
            }
            hintAria={copy.detail.airHint}
            hintText={copy.detail.airTooltip}
          />
          <DataTile
            icon={<Gauge className="text-ink-2 size-4" strokeWidth={2} />}
            label={copy.detail.weatherDanger}
            value={
              region.weather_danger
                ? copy.bahaya[region.weather_danger.class]
                : 'FWI belum tersedia'
            }
            unit={
              region.weather_danger
                ? `${copy.detail.fwiUnit} ${formatNumber(region.weather_danger.fwi)}`
                : 'Belum ada FWI terverifikasi'
            }
            hintAria={copy.detail.weatherDangerHint}
            hintText={copy.detail.weatherDangerTooltip}
          />
          <DataTile
            icon={<Droplets className="text-ink-2 size-4 animate-water-ripple" strokeWidth={2} />}
            label={copy.detail.humidity}
            value={formatNumber(region.weather.humidity)}
            unit="%"
          />
          <DataTile
            icon={<Wind className="text-ink-2 size-4 animate-wind-drift" strokeWidth={2} />}
            label={copy.detail.wind}
            value={formatNumber(region.weather.wind_kmh)}
            unit={copy.detail.windUnit}
          />
          <DataTile
            icon={<CloudRain className="text-ink-2 size-4 animate-water-ripple" strokeWidth={2} />}
            label={copy.detail.dryDays}
            value={formatNumber(region.weather.dry_days)}
            unit={copy.detail.dayUnit}
          />
        </div>
      </section>
    </div>
  )
}

function RiskCard({ region }: { region: Region }) {
  const style = RISK_CATEGORIES[region.risk_category]
  const hotspots = formatNumber(region.hotspots_24h)

  return (
    <section
      className="rounded-card space-y-2 p-3"
      style={{ backgroundColor: style.tint, color: style.text }}
    >
      <div>
        <div className="flex items-center gap-1">
          <p className="text-xs leading-4 font-medium">{copy.detail.riskTitle}</p>
          <HintButton
            ariaLabel={copy.detail.riskHint}
            text={copy.detail.riskTooltip}
            className="opacity-70 hover:text-inherit hover:opacity-100"
            style={{ color: style.text }}
          />
        </div>
        <p className="mt-1 text-xl font-semibold">{region.risk_category === 'tidak_tersedia' && region.quality === 'stale' ? 'Indikator kedaluwarsa' : style.label}</p>
      </div>
      <p className="flex items-center gap-1 text-sm" style={{ color: style.text }}>
        <Radar className="size-4 shrink-0 opacity-80 animate-radar-pulse" strokeWidth={2} aria-hidden />
        <span>{copy.detail.hotspots24hReason(hotspots)}</span>
      </p>
    </section>
  )
}
