import { useState } from 'react'
import { useSession } from '@/auth/session'
import { Button, DataTile, SectionLabel } from '@/components/common'
import { focusRing } from '@/components/common/focus-ring'
import { useOptionalData } from '@/data/queries'
import {
  summarySchema,
  sourceStatusSchema,
  earthquakesSchema,
  forecastSchema,
} from '@/data/extended-contract'
import { formatDateTime, formatNumber } from '@/lib/format'
import { copy } from '@/copy/id'
export function SourceDataPanel() {
  const [opened, setOpened] = useState(false)
  const generation = useSession((s) => s.generation)
  return (
    <details
      className="rounded-card border-line border p-3"
      onToggle={(e) => setOpened(e.currentTarget.open)}
    >
      <summary className={`text-ink cursor-pointer text-sm font-semibold ${focusRing}`}>
        {copy.extra.sources}
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
  const [adm4, setAdm4] = useState('')
  const [requestedVillage, setRequestedVillage] = useState('')
  const forecast = useOptionalData(
    'bmkg-weather',
    `/weather/bmkg?adm4=${encodeURIComponent(requestedVillage)}`,
    (raw) => forecastSchema.parse(raw),
    !!requestedVillage,
  )
  return (
    <div className="mt-4 space-y-4">
      <section className="space-y-2">
        <SectionLabel>{copy.extra.national}</SectionLabel>
        <p className="text-ink-2 text-xs">{copy.extra.nationalNote}</p>
        {national.isPending ? (
          <p role="status" className="text-xs">
            {copy.common.loading}
          </p>
        ) : national.isError ? (
          <p role="alert" className="text-xs">
            {copy.extra.unavailable}
          </p>
        ) : (
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
        )}
        <Button
          size="md"
          disabled={national.isFetching || freshness.isFetching}
          onClick={() => {
            void national.refetch()
            void freshness.refetch()
          }}
        >
          {copy.common.retry}
        </Button>
      </section>
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
      <section className="space-y-2">
        <SectionLabel>{copy.extra.earthquakes}</SectionLabel>
        <label htmlFor="earthquake-kind" className="block text-xs">
          {copy.extra.feed}
        </label>
        <select
          id="earthquake-kind"
          value={kind}
          onChange={(e) => {
            setKind(e.target.value)
            setEarthquakeRequested(false)
          }}
          className={`rounded-ctl border-line h-11 w-full border px-3 text-lg ${focusRing}`}
        >
          <option value="latest">{copy.extra.latest}</option>
          <option value="felt">{copy.extra.felt}</option>
          <option value="m5">{copy.extra.m5}</option>
        </select>
        <Button
          size="md"
          disabled={earthquakes.isFetching}
          onClick={() => {
            setEarthquakeRequested(true)
            if (earthquakeRequested) void earthquakes.refetch()
          }}
        >
          {earthquakes.isFetching ? copy.common.loading : copy.extra.loadEarthquakes}
        </Button>
        {earthquakes.isError && (
          <p role="alert" className="text-xs">
            {copy.extra.unavailable}
          </p>
        )}
        {earthquakeRequested && earthquakes.data && (
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
      <section className="space-y-2">
        <SectionLabel>{copy.extra.bmkg}</SectionLabel>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (requestedVillage === adm4) void forecast.refetch()
            else setRequestedVillage(adm4)
          }}
          className="space-y-2"
        >
          <label htmlFor="adm4" className="block text-xs">
            {copy.extra.villageCode}
          </label>
          <input
            id="adm4"
            value={adm4}
            onChange={(e) => setAdm4(e.target.value)}
            required
            pattern="[0-9]{2}\.[0-9]{2}\.[0-9]{2}\.[0-9]{4}"
            maxLength={13}
            className={`rounded-ctl border-line h-11 w-full border px-3 text-lg ${focusRing}`}
            aria-describedby="adm4-help"
          />
          <p id="adm4-help" className="text-ink-2 text-xs">
            {copy.extra.villageHelp}
          </p>
          <Button
            size="md"
            type="submit"
            disabled={!/^\d{2}\.\d{2}\.\d{2}\.\d{4}$/.test(adm4) || forecast.isFetching}
          >
            {forecast.isFetching ? copy.common.loading : copy.extra.loadForecast}
          </Button>
        </form>
        {forecast.isError && (
          <p role="alert" className="text-xs">
            {copy.extra.unavailable}
          </p>
        )}
        {forecast.data && (
          <>
            <p className="text-sm font-medium">{forecast.data.data.nama}</p>
            <p className="text-ink-2 text-xs">{forecast.data.keterangan}</p>
            <p className="text-ink-2 text-xs">
              {forecast.data.sumber} · {formatDateTime(forecast.data.diambil, 'WIB')}
            </p>
            {forecast.data.data.prakiraan.length === 0 && (
              <p className="text-xs">{copy.extra.empty}</p>
            )}
            <ul className="space-y-2">
              {forecast.data.data.prakiraan.map((point, i) => (
                <li
                  key={point.waktu + i}
                  className="rounded-ctl bg-surface-muted p-2 text-xs"
                >
                  {formatDateTime(point.waktu, 'WIB')} · {point.kondisi}
                  <p>
                    {formatNumber(point.suhu_c)}°C · {formatNumber(point.kelembapan)}% ·{' '}
                    {formatNumber(point.angin_kmj)} km/jam
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  )
}
