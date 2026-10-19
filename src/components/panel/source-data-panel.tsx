import { ChevronDown, CloudSun, Database } from 'lucide-react'
import { useState } from 'react'

import { Button, ProgressBar } from '@/components/common'
import { focusRing } from '@/components/common/focus-ring'
import { Card, CardContent } from '@/components/ui/card'
import { copy } from '@/copy/id'
import {
  forecastSchema,
  providerRegistrySchema,
  sourceStatusSchema,
  summarySchema,
  type Village,
} from '@/data/extended-contract'
import { useOptionalData } from '@/data/queries'
import { formatDateTime, formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import { VillageSearch } from './village-search'

export function SourceDataPanel() {
  const [open, setOpen] = useState(false)

  return (
    <Card>
      <details onToggle={(event) => setOpen(event.currentTarget.open)}>
        <summary
          className={cn(
            'text-ink hover:bg-surface-muted flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 text-sm font-semibold [&::-webkit-details-marker]:hidden',
            focusRing,
          )}
        >
          <span className="flex items-center gap-2">
            <Database className="text-brand size-4" aria-hidden />
            Data nasional & sumber
          </span>
          <ChevronDown
            className={cn('size-4 transition-transform', open && 'rotate-180')}
            aria-hidden
          />
        </summary>
        {open ? <SourceDataContent /> : null}
      </details>
    </Card>
  )
}

function SourceDataContent() {
  const summary = useOptionalData(
    'national-summary',
    '/summary',
    (raw) => summarySchema.parse(raw).data,
    true,
  )
  const status = useOptionalData(
    'all-source-status',
    '/data-status',
    (raw) => sourceStatusSchema.parse(raw).data,
    true,
  )
  const providers = useOptionalData(
    'provider-registry',
    '/providers/registry',
    (raw) => providerRegistrySchema.parse(raw).data,
    true,
  )
  const [village, setVillage] = useState<Village | null>(null)
  const forecast = useOptionalData(
    'bmkg-village-weather',
    `/weather/bmkg?adm4=${encodeURIComponent(village?.kode ?? '')}`,
    (raw) => forecastSchema.parse(raw),
    Boolean(village),
  )
  const loading = summary.isFetching || status.isFetching || providers.isFetching

  return (
    <CardContent className="border-line space-y-5 border-t pt-3">
      {loading ? <ProgressBar /> : null}
      <section className="space-y-2">
        <h3 className="text-ink text-xs font-semibold">Ringkasan nasional</h3>
        {summary.isError ? (
          <p role="alert" className="text-ink-2 text-xs">
            Ringkasan nasional belum dapat dimuat.
          </p>
        ) : null}
        {summary.data ? (
          <dl className="grid grid-cols-2 gap-2">
            {[
              ['Titik panas 24 jam', formatNumber(summary.data.titik_panas_24j)],
              ['24 jam sebelumnya', formatNumber(summary.data.titik_panas_kemarin)],
              [
                'Perubahan harian',
                summary.data.perubahan_harian == null
                  ? '—'
                  : `${formatNumber(summary.data.perubahan_harian * 100, { maximumFractionDigits: 1 })}%`,
              ],
              ['Wilayah sangat tinggi', formatNumber(summary.data.wilayah_sangat_tinggi)],
            ].map(([label, value]) => (
              <div key={label} className="bg-surface-muted rounded-ctl p-3">
                <dt className="text-ink-2 text-xs leading-4">{label}</dt>
                <dd className="text-ink mt-1 font-mono text-sm font-semibold tabular-nums">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </section>

      <section className="border-line space-y-2 border-t pt-4">
        <h3 className="text-ink text-xs font-semibold">Status sumber data</h3>
        {status.data ? (
          <ul className="space-y-2">
            {Object.entries(status.data.sumber).map(([name, source]) => (
              <li
                key={name}
                className="bg-surface-muted rounded-ctl flex items-start justify-between gap-3 px-3 py-2 text-xs"
              >
                <span className="text-ink font-medium capitalize">{name}</span>
                <span className="text-ink-2 text-right">
                  {source.status} ·{' '}
                  {source.diperbarui
                    ? formatDateTime(source.diperbarui, 'WIB')
                    : 'belum ada waktu'}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        {providers.data ? (
          <div className="flex flex-wrap gap-2" aria-label={copy.extra.providers}>
            {providers.data.map((provider) => (
              <span
                key={provider.id}
                title={provider.attribution}
                className="border-line bg-surface text-ink-2 rounded-full border px-2 py-1 text-xs"
              >
                {provider.provider} · {provider.status}
              </span>
            ))}
          </div>
        ) : null}
      </section>

      <section className="border-line space-y-3 border-t pt-4">
        <div className="flex items-center gap-2">
          <CloudSun className="text-brand size-4" aria-hidden />
          <h3 className="text-ink text-xs font-semibold">Prakiraan cuaca desa BMKG</h3>
        </div>
        <VillageSearch value={village} onChange={setVillage} />
        {village ? (
          <p className="text-ink-2 text-xs leading-4">
            {village.kecamatan}, {village.kabupaten}, {village.provinsi}
          </p>
        ) : (
          <p className="text-ink-2 text-xs leading-4">
            Cari desa untuk mengambil prakiraan resmi pada kode wilayah yang tepat.
          </p>
        )}
        {forecast.isFetching ? <ProgressBar /> : null}
        {forecast.isError ? (
          <div className="space-y-2">
            <p role="alert" className="text-ink-2 text-xs">
              Prakiraan BMKG belum dapat dimuat.
            </p>
            <Button variant="secondary" size="sm" onClick={() => void forecast.refetch()}>
              Coba lagi
            </Button>
          </div>
        ) : null}
        {forecast.data ? (
          <div>
            <ul className="divide-line divide-y">
              {forecast.data.data.prakiraan.slice(0, 4).map((point) => (
                <li key={point.waktu} className="py-2 text-xs">
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="text-ink-2">{formatDateTime(point.waktu, 'WIB')}</p>
                      <p className="text-ink mt-1 font-medium">{point.kondisi}</p>
                    </div>
                    <p className="text-ink shrink-0 font-mono font-semibold">
                      {formatNumber(point.suhu_c)}°C
                    </p>
                  </div>
                  <p className="text-ink-2 mt-1">
                    Kelembapan {formatNumber(point.kelembapan)}% · Angin{' '}
                    {formatNumber(point.angin_kmj)} km/jam
                  </p>
                </li>
              ))}
            </ul>
            <p className="text-ink-3 mt-2 text-xs">{forecast.data.sumber}</p>
          </div>
        ) : null}
      </section>
    </CardContent>
  )
}
