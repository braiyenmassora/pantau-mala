import { Cloud, CloudFog, CloudRain, CloudSun } from 'lucide-react'

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
 * Callout pin terpilih — nama, provinsi, suhu + ikon cuaca/udara.
 * `mb-8` menjauh dari halo; panah diamond mengarah ke pin.
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
      <div className="border-line bg-surface rounded-card relative w-max max-w-56 border px-3 py-2 shadow-md">
        <div className="flex min-w-0 flex-col gap-1 text-left">
          <p
            className="text-ink truncate text-xs leading-4 font-semibold"
            title={content.title}
          >
            {content.title}
          </p>
          <p className="text-ink-2 truncate text-xs leading-4" title={content.subtitle}>
            {content.subtitle}
          </p>
          <div className="border-line mt-1 flex items-center gap-3 border-t pt-2">
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
        </div>
        <span
          aria-hidden
          className="border-line bg-surface absolute top-full left-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border-r border-b"
        />
      </div>
    </div>
  )
}
