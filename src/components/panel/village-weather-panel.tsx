import { CloudSun, RefreshCw, Wind } from 'lucide-react'
import { useId, useRef, useState } from 'react'

import { Button, ProgressBar, SectionLabel } from '@/components/common'
import { focusRing } from '@/components/common/focus-ring'
import { copy } from '@/copy/id'
import { forecastSchema, type Village } from '@/data/extended-contract'
import { useOptionalData, useWindyWeather } from '@/data/queries'
import { formatDateTime, formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import { VillageSearch } from './village-search'

type WeatherTab = 'weather' | 'wind'

export function VillageWeatherPanel() {
  const id = useId()
  const [village, setVillage] = useState<Village | null>(null)
  const [tab, setTab] = useState<WeatherTab>('weather')
  const weatherTabRef = useRef<HTMLButtonElement>(null)
  const windTabRef = useRef<HTMLButtonElement>(null)
  const forecast = useOptionalData(
    'bmkg-weather',
    `/weather/bmkg?adm4=${encodeURIComponent(village?.kode ?? '')}`,
    (raw) => forecastSchema.parse(raw),
    village !== null,
  )
  const bmkg = forecast.data?.data.kode_desa === village?.kode ? forecast.data : undefined
  const center = bmkg?.data.pusat
  const windy = useWindyWeather(
    tab === 'wind' ? center?.[1] : undefined,
    tab === 'wind' ? center?.[0] : undefined,
  )
  const loading =
    !!village && (forecast.isFetching || (tab === 'wind' && windy.isFetching))

  function refresh() {
    if (!village) return
    if (tab === 'wind' && center) void windy.refetch()
    else void forecast.refetch()
  }

  return (
    <section aria-labelledby={`${id}-heading`} className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div id={`${id}-heading`} className="flex items-center gap-2">
          <CloudSun className="text-brand size-4 shrink-0" strokeWidth={2} aria-hidden />
          <SectionLabel>{copy.weather.title}</SectionLabel>
        </div>
        {village && (
          <Button
            variant="secondary"
            size="sm"
            loading={loading}
            onClick={refresh}
            aria-label={copy.weather.refresh}
          >
            <RefreshCw className="size-4" strokeWidth={2} aria-hidden />
            {copy.common.refresh}
          </Button>
        )}
      </div>
      <VillageSearch
        value={village}
        onChange={(next) => {
          setVillage(next)
          setTab('weather')
        }}
      />
      {village ? (
        <p className="text-ink-2 text-xs leading-4 break-words">
          {village.kecamatan}, {village.kabupaten}, {village.provinsi}
        </p>
      ) : (
        <p className="text-ink-2 text-xs leading-4">{copy.weather.chooseLocation}</p>
      )}
      {village && (
        <>
          <div
            role="tablist"
            aria-label={copy.weather.tabsLabel}
            className="rounded-ctl bg-surface-muted grid grid-cols-2 gap-1 p-1"
            onKeyDown={(event) => {
              if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
              event.preventDefault()
              const next =
                event.key === 'Home'
                  ? 'weather'
                  : event.key === 'End'
                    ? 'wind'
                    : tab === 'weather'
                      ? 'wind'
                      : 'weather'
              setTab(next)
              ;(next === 'weather' ? weatherTabRef : windTabRef).current?.focus()
            }}
          >
            {(['weather', 'wind'] as const).map((name) => (
              <button
                key={name}
                ref={name === 'weather' ? weatherTabRef : windTabRef}
                id={`${id}-${name}-tab`}
                type="button"
                role="tab"
                aria-selected={tab === name}
                aria-controls={`${id}-${name}-panel`}
                tabIndex={tab === name ? 0 : -1}
                onClick={() => setTab(name)}
                className={cn(
                  'rounded-ctl flex h-10 min-w-0 items-center justify-center gap-2 px-2 text-xs transition-colors duration-150',
                  tab === name
                    ? 'bg-surface text-ink font-medium shadow-sm'
                    : 'text-ink-2 hover:text-ink',
                  focusRing,
                )}
              >
                {name === 'weather' ? (
                  <CloudSun className="size-4 shrink-0" strokeWidth={2} aria-hidden />
                ) : (
                  <Wind className="size-4 shrink-0" strokeWidth={2} aria-hidden />
                )}
                <span>
                  {name === 'weather' ? copy.weather.weatherTab : copy.weather.windTab}
                </span>
                <span className="text-ink-2">
                  {name === 'weather' ? copy.weather.bmkg : copy.weather.windy}
                </span>
              </button>
            ))}
          </div>
          {loading && <ProgressBar />}
          <div
            id={`${id}-weather-panel`}
            role="tabpanel"
            aria-labelledby={`${id}-weather-tab`}
            hidden={tab !== 'weather'}
          >
            {forecast.isError && (
              <p role="alert" className="text-ink-2 text-xs leading-4">
                {copy.weather.bmkgUnavailable}
              </p>
            )}
            {bmkg && (
              <>
                <ul className="divide-line divide-y">
                  {bmkg.data.prakiraan.slice(0, 4).map((point) => (
                    <li key={point.waktu} className="space-y-1 py-2 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-ink-2">
                            {formatDateTime(point.waktu, 'WIB')}
                          </p>
                          <p className="text-ink mt-1 font-medium">{point.kondisi}</p>
                        </div>
                        <p className="text-ink shrink-0 font-semibold tabular-nums">
                          {formatNumber(point.suhu_c)}
                          {'\u00b0C'}
                        </p>
                      </div>
                      <dl className="text-ink-2 flex flex-wrap gap-3">
                        <div className="flex gap-1">
                          <dt>{copy.weather.humidity}</dt>
                          <dd>{formatNumber(point.kelembapan)}%</dd>
                        </div>
                        <div className="flex gap-1">
                          <dt>{copy.weather.windSpeed}</dt>
                          <dd>{formatNumber(point.angin_kmj)} km/j</dd>
                        </div>
                      </dl>
                    </li>
                  ))}
                </ul>
                {!bmkg.data.prakiraan.length && (
                  <p className="text-ink-2 text-xs">{copy.extra.empty}</p>
                )}
                <p className="text-ink-2 mt-2 text-xs leading-4">
                  {bmkg.sumber} · {copy.weather.fetched}{' '}
                  {formatDateTime(bmkg.diambil, 'WIB')}
                </p>
              </>
            )}
          </div>
          <div
            id={`${id}-wind-panel`}
            role="tabpanel"
            aria-labelledby={`${id}-wind-tab`}
            hidden={tab !== 'wind'}
          >
            {!center && !forecast.isFetching && (
              <p role="status" className="text-ink-2 text-xs leading-4">
                {copy.weather.windNeedsLocation}
              </p>
            )}
            {center && windy.isError && (
              <p role="alert" className="text-ink-2 text-xs leading-4">
                {copy.weather.windyUnavailable}
              </p>
            )}
            {center && windy.data && (
              <>
                <p className="text-ink-2 text-xs leading-4">
                  {copy.extra.windyNote(windy.data.data.model)}
                </p>
                <p className="text-ink-2 text-xs">
                  {copy.weather.model(windy.data.data.model.toUpperCase())}
                </p>
                <ul className="divide-line mt-1 divide-y">
                  {windy.data.data.titik.slice(0, 4).map((point) => (
                    <li key={point.ts} className="space-y-1 py-2 text-xs">
                      <p className="text-ink-2">
                        {formatDateTime(new Date(point.ts).toISOString(), 'WIB')}
                      </p>
                      <dl className="flex flex-wrap gap-3">
                        <div className="flex gap-1">
                          <dt className="text-ink-2">{copy.weather.windSpeed}</dt>
                          <dd className="text-ink font-medium tabular-nums">
                            {formatNumber(point.kecepatan_angin_kmj)} km/j
                          </dd>
                        </div>
                        <div className="flex gap-1">
                          <dt className="text-ink-2">{copy.weather.gust}</dt>
                          <dd className="text-ink font-medium tabular-nums">
                            {formatNumber(point.hembusan_kmj)} km/j
                          </dd>
                        </div>
                      </dl>
                    </li>
                  ))}
                </ul>
                {!windy.data.data.titik.length && (
                  <p className="text-ink-2 text-xs">{copy.extra.empty}</p>
                )}
                <p className="text-ink-2 mt-2 text-xs leading-4">
                  {windy.data.sumber} · {copy.weather.fetched}{' '}
                  {formatDateTime(windy.data.diambil, 'WIB')}
                </p>
              </>
            )}
          </div>
        </>
      )}
    </section>
  )
}
