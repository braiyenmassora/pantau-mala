import { ChevronDown, CloudSun, Database } from 'lucide-react'
import { useState } from 'react'

import { Button, ProgressBar, Sparkline } from '@/components/common'
import { focusRing } from '@/components/common/focus-ring'
import { Card, CardContent } from '@/components/ui/card'
import { copy } from '@/copy/id'
import {
  forecastSchema,
  providerProvenanceSchema,
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
  const summary = useOptionalData(
    'national-summary',
    '/summary',
    (raw) => summarySchema.parse(raw).data,
    true,
  )

  return (
    <Card>
      <CardContent className="space-y-3 pt-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-ink-3 text-xs font-medium">Situasi nasional · 24 jam</p>
            <p className="text-ink mt-1 font-mono text-2xl font-semibold tabular-nums">
              {summary.data ? formatNumber(summary.data.titik_panas_24j) : '—'}
            </p>
            <p className="text-ink-2 text-xs">titik panas terdeteksi</p>
          </div>
          {summary.data ? (
            <div className="text-right">
              <span className="text-brand bg-brand-soft rounded-full px-2 py-1 text-xs font-semibold capitalize">
                {summary.data.arah_tren}
              </span>
              <Sparkline
                data={summary.data.tren_7h}
                width={72}
                height={28}
                className="mt-2 opacity-70"
              />
            </div>
          ) : null}
        </div>
        {summary.isFetching && !summary.data ? <ProgressBar /> : null}
        {summary.isError ? (
          <p role="alert" className="text-ink-2 text-xs">
            Ringkasan nasional belum dapat dimuat.
          </p>
        ) : null}
        {summary.data ? (
          <dl className="grid grid-cols-3 gap-2">
            <div className="bg-surface-muted rounded-ctl p-2">
              <dt className="text-ink-3 text-xs">Sebelumnya</dt>
              <dd className="text-ink mt-1 font-mono text-sm font-semibold">
                {formatNumber(summary.data.titik_panas_kemarin)}
              </dd>
            </div>
            <div className="bg-surface-muted rounded-ctl p-2">
              <dt className="text-ink-3 text-xs">Perubahan</dt>
              <dd className="text-ink mt-1 font-mono text-sm font-semibold">
                {summary.data.perubahan_harian == null
                  ? '—'
                  : `${formatNumber(summary.data.perubahan_harian * 100, { maximumFractionDigits: 1 })}%`}
              </dd>
            </div>
            <div className="bg-surface-muted rounded-ctl p-2">
              <dt className="text-ink-3 text-xs">Sangat tinggi</dt>
              <dd className="text-ink mt-1 font-mono text-sm font-semibold">
                {formatNumber(summary.data.wilayah_sangat_tinggi)}
              </dd>
            </div>
          </dl>
        ) : null}
        {summary.data ? (
          <div
            className="flex flex-wrap gap-2"
            aria-label={copy.extra.categoryDistribution}
          >
            {Object.entries(summary.data.jumlah_kategori).map(([category, count]) => (
              <span
                key={category}
                className="border-line text-ink-2 rounded-full border px-2 py-1 text-xs capitalize"
              >
                {category.replaceAll('_', ' ')} · {formatNumber(count)}
              </span>
            ))}
          </div>
        ) : null}
      </CardContent>
      <details onToggle={(event) => setOpen(event.currentTarget.open)}>
        <summary
          className={cn(
            'border-line text-ink hover:bg-surface-muted flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 border-t px-3 text-sm font-semibold [&::-webkit-details-marker]:hidden',
            focusRing,
          )}
        >
          <span className="flex items-center gap-2">
            <Database className="text-brand size-4" aria-hidden />
            Sumber data & cuaca desa
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
  const provenance = useOptionalData(
    'provider-provenance',
    '/providers/provenance?limit=10',
    (raw) => providerProvenanceSchema.parse(raw).data,
    true,
  )
  const [village, setVillage] = useState<Village | null>(null)
  const forecast = useOptionalData(
    'bmkg-village-weather',
    `/weather/bmkg?adm4=${encodeURIComponent(village?.kode ?? '')}`,
    (raw) => forecastSchema.parse(raw),
    Boolean(village),
  )
  const loading = status.isFetching || providers.isFetching || provenance.isFetching

  return (
    <CardContent className="border-line space-y-5 border-t pt-3">
      {loading ? <ProgressBar /> : null}
      <section className="space-y-2">
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
        {provenance.data?.length ? (
          <div className="border-line mt-3 border-t pt-3">
            <h4 className="text-ink text-xs font-semibold">Aktivitas penyedia terbaru</h4>
            <ul className="mt-2 space-y-2">
              {provenance.data.slice(0, 5).map((item) => (
                <li
                  key={`${item.penyedia}-${item.waktu_tarik}-${item.endpoint}`}
                  className="flex items-start justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="text-ink truncate font-medium">{item.penyedia}</p>
                    <p className="text-ink-3 mt-1 capitalize">
                      {item.sifat_data} · {item.validasi}
                    </p>
                  </div>
                  <span className="text-ink-2 shrink-0 text-right">
                    {item.status} · {formatDateTime(item.waktu_tarik, 'WIB')}
                  </span>
                </li>
              ))}
            </ul>
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
