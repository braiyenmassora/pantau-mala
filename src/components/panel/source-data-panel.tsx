import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSession } from '@/auth/session'
import {
  Button,
  DataTile,
  SectionLabel,
  ProgressBar,
  TrendChart,
} from '@/components/common'
import { focusRing } from '@/components/common/focus-ring'
import { useOptionalData } from '@/data/queries'
import {
  summarySchema,
  sourceStatusSchema,
  earthquakesSchema,
} from '@/data/extended-contract'
import { formatDateTime, formatNumber } from '@/lib/format'
import { copy } from '@/copy/id'
import { VillageWeatherPanel } from './village-weather-panel'

export function SourceDataPanel() {
  const [opened, setOpened] = useState(false)
  const generation = useSession((s) => s.generation)
  return (
    <details
      className="rounded-card border-line border p-3"
      onToggle={(e) => setOpened(e.currentTarget.open)}
    >
      <summary
        className={cn(
          'text-ink-2 hover:text-ink flex cursor-pointer list-none items-center justify-between gap-2 text-xs font-medium [&::-webkit-details-marker]:hidden',
          focusRing,
        )}
      >
        <span>{copy.extra.sources}</span>
        <ChevronDown
          className={cn(
            'size-4 shrink-0 transition-transform duration-200',
            opened && 'rotate-180',
          )}
          strokeWidth={2}
          aria-hidden
        />
      </summary>
      {opened && <SourceDataContent key={generation} />}
    </details>
  )
}

function SourceDataContent() {
  const national = useOptionalData(
    'national-summary',
    '/summary',
    (raw) => summarySchema.parse(raw).data,
    true,
  )
  const freshness = useOptionalData(
    'source-status',
    '/data-status',
    (raw) => sourceStatusSchema.parse(raw).data,
    true,
  )
  const [kind, setKind] = useState('latest')
  const [earthquakeRequested, setEarthquakeRequested] = useState(false)
  const earthquakes = useOptionalData(
    'earthquakes',
    `/earthquakes?kind=${kind}`,
    (raw) => earthquakesSchema.parse(raw),
    earthquakeRequested,
  )

  return (
    <div className="mt-4 space-y-4">
      {/* 1. National Summary */}
      <section className="space-y-2">
        <SectionLabel>{copy.extra.national}</SectionLabel>
        <p className="text-ink-2 text-xs">{copy.extra.nationalNote}</p>
        {(national.isFetching || freshness.isFetching) && (
          <ProgressBar className="my-2" />
        )}
        {national.isPending ? (
          <p role="status" className="text-xs">
            {copy.common.loading}
          </p>
        ) : national.isError ? (
          <p role="alert" className="text-xs">
            {copy.extra.unavailable}
          </p>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <DataTile
                label={copy.extra.today}
                value={formatNumber(national.data.titik_panas_24j)}
              />
              <DataTile
                label={copy.extra.yesterday}
                value={formatNumber(national.data.titik_panas_kemarin)}
              />
              <DataTile
                label={copy.extra.dailyChange}
                value={formatNumber(national.data.perubahan_harian, {
                  maximumFractionDigits: 1,
                })}
                unit="%"
              />
              <DataTile
                label={copy.extra.highRegions}
                value={formatNumber(national.data.wilayah_sangat_tinggi)}
              />
            </div>
            <TrendChart
              values={national.data.tren_7h}
              timeZone="WIB"
              label="Tren nasional 7 hari"
            />
          </div>
        )}
        <Button
          size="sm"
          variant="secondary"
          loading={national.isFetching || freshness.isFetching}
          onClick={() => {
            void national.refetch()
            void freshness.refetch()
          }}
        >
          {copy.common.retry}
        </Button>
      </section>

      {/* 2. Source Freshness */}
      <section className="space-y-2">
        <SectionLabel>{copy.extra.freshness}</SectionLabel>
        {freshness.isPending && (
          <p role="status" className="text-xs">
            {copy.common.loading}
          </p>
        )}
        {freshness.isError && (
          <p role="alert" className="text-xs">
            {copy.extra.unavailable}
          </p>
        )}
        {freshness.data && (
          <ul className="space-y-2">
            {Object.entries(freshness.data.sumber).map(([name, state]) => (
              <li key={name} className="rounded-ctl bg-surface-muted p-2 text-xs">
                <span className="font-medium break-words">{name}</span>
                <p>
                  {state.status} ·{' '}
                  {state.diperbarui
                    ? formatDateTime(state.diperbarui, 'WIB')
                    : copy.extra.noTimestamp}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 3. Earthquakes */}
      <section className="space-y-2">
        <SectionLabel>{copy.extra.earthquakes}</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {(['latest', 'felt', 'm5'] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setKind(k)
                setEarthquakeRequested(true)
              }}
              className={cn(
                'border-line bg-surface text-ink-2 hover:bg-surface-muted hover:text-ink rounded-ctl border px-3 py-1 text-xs transition-colors',
                focusRing,
                kind === k && 'border-brand text-brand bg-brand-soft font-medium',
              )}
            >
              {copy.extra[k]}
            </button>
          ))}
        </div>
        <Button
          size="sm"
          variant="secondary"
          loading={earthquakes.isFetching}
          onClick={() => {
            setEarthquakeRequested(true)
            if (earthquakeRequested) void earthquakes.refetch()
          }}
        >
          {copy.extra.loadEarthquakes}
        </Button>
        {earthquakes.isFetching && <ProgressBar className="my-2" />}
        {earthquakes.isError && (
          <p role="alert" className="text-xs">
            {copy.extra.unavailable}
          </p>
        )}
        {earthquakes.data && (
          <>
            <p className="text-ink-2 text-xs">{earthquakes.data.keterangan}</p>
            <p className="text-ink-2 text-xs">
              {earthquakes.data.sumber} ·{' '}
              {formatDateTime(earthquakes.data.diambil, 'WIB')}
            </p>
            {earthquakes.data.data.length === 0 && (
              <p className="text-xs">{copy.extra.empty}</p>
            )}
            <ul className="space-y-2">
              {earthquakes.data.data.map((event, i) => (
                <li
                  key={event.waktu + i}
                  className="rounded-ctl bg-surface-muted space-y-1 p-3 text-xs"
                >
                  <p className="font-semibold">
                    M {formatNumber(event.magnitudo)} · {event.wilayah}
                  </p>
                  <p>
                    {formatDateTime(event.waktu, 'WIB')} ·{' '}
                    {formatNumber(event.kedalaman_km)} km
                  </p>
                  <p>{event.potensi}</p>
                  {event.dirasakan && <p>{event.dirasakan}</p>}
                  <p>
                    {event.pusat[1]}, {event.pusat[0]}
                  </p>
                  {/^https:\/\/static\.bmkg\.go\.id\/[0-9]+\.mmi\.jpg$/.test(
                    event.shakemap,
                  ) && (
                    <a
                      className={`text-brand underline ${focusRing}`}
                      href={event.shakemap}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {copy.extra.shakemap}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <VillageWeatherPanel />
    </div>
  )
}
