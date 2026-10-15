import { Cloud, CloudFog, CloudRain, CloudSun } from 'lucide-react'

import { MapInfoCard } from '@/components/map/map-info-card'
import { buildDetectionFlag, type WeatherIconKind } from '@/lib/detection-flag'
import type { Region } from '@/data/types'
import { cn } from '@/lib/utils'

type DetectionFlagProps = {
  region: Region
  className?: string
}

const WEATHER_ICON: Record<WeatherIconKind, typeof CloudSun> = {
  sun: CloudSun,
  cloud: Cloud,
  rain: CloudRain,
  fog: CloudFog,
}

/** Sama keluarga motion panel detail (water-ripple / wind-drift). */
const WEATHER_ANIM: Record<WeatherIconKind, string> = {
  sun: 'animate-wind-drift',
  cloud: 'animate-wind-drift',
  rain: 'animate-water-ripple',
  fog: 'animate-wind-drift',
}

/**
 * Callout pin terpilih — pola sama MapInfoCard; `mb-8` menjauh dari halo.
 */
export function DetectionFlag({ region, className }: DetectionFlagProps) {
  const content = buildDetectionFlag(region)
  const WeatherIcon = WEATHER_ICON[content.weatherKind]

  return (
    <div
      role="status"
      className={cn(
        'pointer-events-none absolute bottom-full left-1/2 z-30 mb-8 -translate-x-1/2',
        className,
      )}
    >
      <MapInfoCard title={content.title} subtitle={content.subtitle}>
        <div className="border-line mt-2 flex items-center gap-3 border-t pt-2">
          <span
            className="text-ink-2 flex min-w-0 items-center gap-1 text-xs leading-4"
            title={region.weather.condition}
          >
            <WeatherIcon
              className={cn('size-3.5 shrink-0', WEATHER_ANIM[content.weatherKind])}
              strokeWidth={2}
              aria-hidden
            />
            <span className="truncate tabular-nums">{content.tempLabel ?? '—'}</span>
          </span>
          <span
            className="text-ink-2 flex min-w-0 items-center gap-1 text-xs leading-4"
            title={content.airLabel}
          >
            <CloudFog
              className="animate-wind-drift size-3.5 shrink-0"
              strokeWidth={2}
              aria-hidden
            />
            <span className="truncate">{content.airLabel}</span>
          </span>
        </div>
      </MapInfoCard>
    </div>
  )
}
