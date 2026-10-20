import {
  Check,
  Clock,
  CloudFog,
  CloudSun,
  Droplets,
  Gauge,
  Minus,
  Sun,
  TrendingDown,
  TrendingUp,
  Wind,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'

import { Badge, InfoTooltip, TrendChart } from '@/components/common'
import { focusRing } from '@/components/common/focus-ring'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { MapRef } from '@/components/ui/map'
import { copy } from '@/copy/id'
import type { Region } from '@/data/types'
import { restoreFocusTrigger } from '@/lib/focus-return'
import { formatDateTime, formatNumber } from '@/lib/format'
import { hotspotTrend, type TrendDirection } from '@/lib/hotspot-trend'
import { fitIndonesia } from '@/lib/indonesia-view'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'
import { RegionTerrainCard } from '@/components/panel/terrain-indicator-card'
import { CitizenReports } from '@/components/panel/citizen-reports'
import { RegionHistoryPanel } from '@/components/panel/region-history-panel'

type RegionDetailPanelProps = {
  region: Region
  mapRef?: RefObject<MapRef | null>
}

type DetailTab = 'ringkasan' | 'laporan' | 'lingkungan' | 'riwayat'

const DETAIL_TABS: Array<{ id: DetailTab; label: string }> = [
  { id: 'ringkasan', label: 'Ringkasan' },
  { id: 'laporan', label: 'Laporan' },
  { id: 'lingkungan', label: 'Lingkungan' },
  { id: 'riwayat', label: 'Riwayat' },
]

const TREND_UI: Record<
  TrendDirection,
  { label: string; Icon: typeof TrendingUp; colorClass: string }
> = {
  naik: { label: copy.detail.trendUp, Icon: TrendingUp, colorClass: 'text-risk-high' },
  turun: {
    label: copy.detail.trendDown,
    Icon: TrendingDown,
    colorClass: 'text-risk-low',
  },
  stabil: { label: copy.detail.trendFlat, Icon: Minus, colorClass: 'text-ink-3' },
}

function updatedWhen(region: Region): string | null {
  const iso =
    region.computed_at ?? region.weather_updated_at ?? region.last_detection?.time ?? null
  if (!iso) return null
  return formatDateTime(iso, region.time_zone)
}

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

function ActionText({ text }: { text: string }) {
  const parts = text.split(/(113)/g)
  return (
    <>
      {parts.map((part, i) =>
        part === '113' ? (
          <a
            key={i}
            href="tel:113"
            className="text-risk-low font-semibold underline underline-offset-2 hover:opacity-80"
          >
            113
          </a>
        ) : (
          part
        ),
      )}
    </>
  )
}

function ConditionCell({
  icon,
  label,
  value,
  isMissing = false,
  tooltip,
}: {
  icon: ReactNode
  label: string
  value: ReactNode
  isMissing?: boolean
  tooltip?: string
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-ink-2 mt-1 shrink-0 [&>svg]:size-5" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-1">
          <p className="text-ink-2 text-xs leading-5">{label}</p>
          {tooltip ? <InfoTooltip content={tooltip} className="size-4" /> : null}
        </div>
        <p
          className={cn(
            'text-base leading-6',
            isMissing ? 'text-ink-3 font-normal' : 'text-ink font-semibold tabular-nums',
          )}
        >
          {value}
        </p>
      </div>
    </div>
  )
}

// ponytail: detail = kartu konsisten + TrendChart 7 hari dari develop.
export function RegionDetailPanel({ region, mapRef }: RegionDetailPanelProps) {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const [activeTab, setActiveTab] = useState<DetailTab>('ringkasan')
  const select = useMapStore((s) => s.select)
  const province = useMapStore((s) => s.province)
  const panelOpen = useUiStore((s) => s.panelOpen)

  const trend = hotspotTrend(region.trend_7d)
  const { label: trendLabel, Icon: TrendIcon, colorClass } = TREND_UI[trend]
  const stamp = updatedWhen(region)
  const actions =
    region.actions.length > 0
      ? region.actions.slice(0, 3).map(sanitizeAction)
      : [
          'Pantau perkembangan titik panas dan arah angin.',
          'Hubungi Damkar di 113 bila melihat kebakaran lahan.',
        ]

  useEffect(() => {
    titleRef.current?.focus()
  }, [region.code])

  function handleBack() {
    select(null)
    restoreFocusTrigger()
    if (mapRef?.current && province === 'Semua') {
      fitIndonesia(mapRef.current, panelOpen, 0)
    }
  }

  return (
    <div key={region.code} className="flex flex-col">
      <div className="flex flex-col gap-3 px-4 pt-0 pb-4 sm:pt-3">
        <section className="px-1 pb-1 sm:pb-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <h2
                  ref={titleRef}
                  tabIndex={-1}
                  className="text-ink truncate text-xl leading-7 font-semibold outline-none"
                  title={region.name}
                >
                  {region.name}
                </h2>
                <InfoTooltip content={copy.panel.limitationNote} />
              </div>
              <p className="text-ink-2 text-xs leading-5">Provinsi {region.province}</p>
            </div>
            <button
              type="button"
              onClick={handleBack}
              aria-label={copy.panel.closeDetail}
              className={cn(
                'text-ink-2 hover:bg-surface-muted hover:text-ink flex size-11 shrink-0 items-center justify-center rounded-full transition-colors',
                focusRing,
              )}
            >
              <X className="size-5 shrink-0" strokeWidth={1.75} aria-hidden />
            </button>
          </div>

          <div className="mt-5 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-ink font-mono text-3xl font-semibold tabular-nums">
                  {formatNumber(region.hotspots_24h)}
                </span>
                <span className="text-ink-2 text-xs leading-5">titik panas · 24 jam</span>
                <InfoTooltip content="Lokasi yang terdeteksi satelit NASA FIRMS memiliki panas permukaan tinggi dalam 24 jam terakhir." />
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Badge variant="category" category={region.risk_category} />
              <InfoTooltip content="Tingkat risiko dihitung dari jumlah titik panas 24 jam terakhir di wilayah ini. Ambang diambil dari risk_thresholds." />
            </div>
          </div>

          <div className="text-ink-2 mt-3 flex items-center gap-2 text-sm leading-5">
            <TrendIcon
              className={cn('size-4 shrink-0', colorClass)}
              strokeWidth={2}
              aria-hidden
            />
            <span className="text-ink font-medium">{trendLabel}</span>
            <InfoTooltip content="Perbandingan jumlah titik panas selama 7 hari terakhir." />
          </div>

          {activeTab === 'ringkasan' ? (
            <>
              <TrendChart
                values={region.trend_7d}
                timeZone={region.time_zone}
                className="mt-4"
              />

              {stamp ? (
                <p className="text-ink-3 mt-3 text-xs leading-5">Diperbarui {stamp}</p>
              ) : null}

              {region.summary ? (
                <p className="bg-surface-muted text-ink rounded-ctl mt-3 px-3 py-2 text-sm leading-5">
                  {region.summary}
                </p>
              ) : null}
              <p className="text-ink-2 mt-2 text-xs leading-4">
                {copy.detail.calibrationNote(
                  region.score == null ? null : formatNumber(region.score),
                  region.quality ?? null,
                )}
              </p>
            </>
          ) : null}
        </section>

        <div
          role="tablist"
          aria-label={copy.panel.regionInformation}
          className="border-line bg-surface sticky top-0 z-10 grid grid-cols-4 border-y py-1"
        >
          {DETAIL_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`region-tab-${tab.id}-trigger`}
              aria-controls={`region-tab-${tab.id}`}
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'rounded-ctl min-h-11 px-1 text-xs font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-brand-soft text-brand'
                  : 'text-ink-2 hover:bg-surface-muted hover:text-ink',
                focusRing,
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div
          role="tabpanel"
          id={`region-tab-${activeTab}`}
          aria-labelledby={`region-tab-${activeTab}-trigger`}
          className="contents"
        >
          {activeTab === 'laporan' ? (
            <CitizenReports regionCode={region.code} timeZone={region.time_zone} />
          ) : null}

          {activeTab === 'lingkungan' ? (
            <RegionTerrainCard center={region.center} timeZone={region.time_zone} />
          ) : null}

          {activeTab === 'lingkungan' ? (
            <Card className="bg-surface-muted border-0">
              <CardHeader>
                <CardTitle>Kondisi saat ini</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <ConditionCell
                    icon={<CloudSun strokeWidth={2} />}
                    label="Cuaca"
                    value={
                      region.weather.temp_c != null
                        ? `${formatNumber(region.weather.temp_c)}°C · ${region.weather.condition}`
                        : region.weather.condition || '—'
                    }
                    isMissing={region.weather.temp_c == null}
                  />
                  <ConditionCell
                    icon={<Droplets strokeWidth={2} />}
                    label="Kelembapan"
                    value={
                      region.weather.humidity != null
                        ? `${formatNumber(region.weather.humidity)}%`
                        : '—'
                    }
                    isMissing={region.weather.humidity == null}
                  />
                  <ConditionCell
                    icon={<Wind strokeWidth={2} />}
                    label="Kecepatan angin"
                    value={
                      region.weather.wind_kmh != null
                        ? `${formatNumber(region.weather.wind_kmh)} km/jam`
                        : '—'
                    }
                    isMissing={region.weather.wind_kmh == null}
                  />
                  <ConditionCell
                    icon={<Sun strokeWidth={2} />}
                    label="Hari tanpa hujan"
                    value={
                      region.weather.dry_days != null
                        ? `${formatNumber(region.weather.dry_days)} hari`
                        : '—'
                    }
                    isMissing={region.weather.dry_days == null}
                  />
                  <ConditionCell
                    icon={<CloudFog strokeWidth={2} />}
                    label="Kualitas udara"
                    value={copy.air[region.air_quality.category]}
                    isMissing={region.air_quality.category === 'missing'}
                    tooltip={copy.detail.airTooltip}
                  />
                  <ConditionCell
                    icon={<Gauge strokeWidth={2} />}
                    label="PM2.5 / ISPU"
                    value={
                      region.air_quality.pm25 != null
                        ? `${formatNumber(region.air_quality.pm25)} µg/m³${region.air_quality.ispu != null ? ` · ${formatNumber(region.air_quality.ispu)}` : ''}`
                        : '—'
                    }
                    isMissing={region.air_quality.pm25 == null}
                    tooltip="PM2.5 adalah estimasi konsentrasi partikel halus. Angka setelah pemisah adalah ISPU bila tersedia."
                  />
                  {region.weather_danger ? (
                    <ConditionCell
                      icon={<Gauge strokeWidth={2} />}
                      label="Kelas FWI"
                      value={`${copy.bahaya[region.weather_danger.class]} (${formatNumber(region.weather_danger.fwi)})`}
                      tooltip={copy.detail.weatherDangerTooltip}
                    />
                  ) : null}
                </div>
                {region.air_quality.pm25_24h != null ||
                region.air_quality.valid_hours != null ||
                region.air_quality.method ||
                region.air_quality.source ||
                region.air_quality.status ||
                region.air_quality.window_end ? (
                  <dl className="border-line mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-4 text-xs">
                    {region.air_quality.pm25_24h != null ? (
                      <div>
                        <dt className="text-ink-3">Rata-rata PM2.5 24 jam</dt>
                        <dd className="text-ink mt-1 font-mono font-semibold">
                          {formatNumber(region.air_quality.pm25_24h)} µg/m³
                        </dd>
                      </div>
                    ) : null}
                    {region.air_quality.valid_hours != null ? (
                      <div>
                        <dt className="text-ink-3">Jam data valid</dt>
                        <dd className="text-ink mt-1 font-semibold">
                          {formatNumber(region.air_quality.valid_hours)} dari 24 jam
                        </dd>
                      </div>
                    ) : null}
                    {region.air_quality.method ? (
                      <div>
                        <dt className="text-ink-3">Metode</dt>
                        <dd className="text-ink mt-1 font-medium">
                          {region.air_quality.method}
                        </dd>
                      </div>
                    ) : null}
                    {region.air_quality.source ? (
                      <div>
                        <dt className="text-ink-3">Sumber udara</dt>
                        <dd className="text-ink mt-1 font-medium">
                          {region.air_quality.source}
                        </dd>
                      </div>
                    ) : null}
                    {region.air_quality.status ? (
                      <div>
                        <dt className="text-ink-3">Status validasi</dt>
                        <dd className="text-ink mt-1 font-medium">
                          {region.air_quality.status}
                        </dd>
                      </div>
                    ) : null}
                    {region.air_quality.window_end ? (
                      <div>
                        <dt className="text-ink-3">Periode berakhir</dt>
                        <dd className="text-ink mt-1 font-medium">
                          {formatDateTime(
                            region.air_quality.window_end,
                            region.time_zone,
                          )}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {activeTab === 'ringkasan' && region.last_detection ? (
            <Card>
              <CardHeader>
                <CardTitle>Deteksi satelit terakhir</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <ConditionCell
                    icon={<Clock strokeWidth={2} />}
                    label="Waktu"
                    value={formatDateTime(region.last_detection.time, region.time_zone)}
                  />
                  <ConditionCell
                    icon={<Gauge strokeWidth={2} />}
                    label="FRP"
                    value={`${formatNumber(region.last_detection.frp_mw)} MW`}
                    tooltip="Fire Radiative Power adalah intensitas energi panas yang terukur oleh sensor satelit."
                  />
                  <ConditionCell
                    icon={<CloudSun strokeWidth={2} />}
                    label="Satelit"
                    value={region.last_detection.satellite}
                  />
                  <ConditionCell
                    icon={<Check strokeWidth={2} />}
                    label="Keyakinan"
                    value={copy.detail.confidence[region.last_detection.confidence]}
                  />
                </div>
                <div className="border-line text-ink-3 mt-3 space-y-1 border-t pt-3 text-xs leading-4">
                  <p>
                    Indikator dihitung:{' '}
                    {region.computed_at
                      ? formatDateTime(region.computed_at, region.time_zone)
                      : 'belum tersedia'}
                  </p>
                  <p>
                    Cuaca diperbarui:{' '}
                    {region.weather_updated_at
                      ? formatDateTime(region.weather_updated_at, region.time_zone)
                      : 'belum tersedia'}
                  </p>
                  <p>
                    Udara diperbarui:{' '}
                    {region.air_updated_at
                      ? formatDateTime(region.air_updated_at, region.time_zone)
                      : 'belum tersedia'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {activeTab === 'riwayat' ? <RegionHistoryPanel code={region.code} /> : null}

          {activeTab === 'ringkasan' ? (
            <section className="border-line border-t px-1 pt-4">
              <h3 className="font-heading text-ink text-sm leading-5 font-semibold">
                Yang bisa kamu lakukan
              </h3>
              <div className="mt-3">
                <ul className="space-y-3">
                  {actions.map((act, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check
                        className="text-risk-low mt-1 size-4 shrink-0"
                        strokeWidth={2}
                        aria-hidden
                      />
                      <span className="text-ink text-sm leading-6">
                        <ActionText text={act} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  )
}
