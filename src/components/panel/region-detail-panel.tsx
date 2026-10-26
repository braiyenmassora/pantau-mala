import {
  Check,
  CloudFog,
  CloudRain,
  Droplets,
  Gauge,
  Minus,
  Sun,
  Thermometer,
  TrendingDown,
  TrendingUp,
  Waves,
  Wind,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, type ReactNode, type RefObject } from 'react'

import {
  CloseIconButton,
  HotspotStatusBadge,
  InfoTooltip,
  Sparkline,
  TrendChart,
} from '@/components/common'
import { AirCategoryPill } from '@/components/panel/air-quality-card'
import { airPm25Value } from '@/lib/air-card'
import { SectionHead } from '@/components/common/section-head'
import { CitizenReportReview } from '@/components/panel/citizen-report-review'
import { DataFreshnessBanner } from '@/components/panel/data-freshness-banner'
import { OfficialRefsCard } from '@/components/panel/official-refs'
import { ShareWilayahButton } from '@/components/panel/share-wilayah-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { MapRef } from '@/components/ui/map'
import { getCopy, getLocale } from '@/copy'
import { useRegionReports } from '@/data/hotspot-reports'
import { useRegionHistory, useRiverDischarge, useWindyForecast } from '@/data/queries'
import type { Region, RiskCategory } from '@/data/types'
import { rememberFocusTrigger, restoreFocusTrigger } from '@/lib/focus-return'
import { formatNumber } from '@/lib/format'
import { hotspotTrend, type TrendDirection } from '@/lib/hotspot-trend'
import { fitIndonesia } from '@/lib/indonesia-view'
import {
  dischargeSeries,
  latestDischargeM3s,
  latestHistoryScore,
  nearestWindyPoint,
  trendValuesFromHistory,
} from '@/lib/region-history'
import { PANEL, T } from '@/lib/pola'
import { effectiveRiskCategory } from '@/lib/risk-rule'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

type RegionDetailPanelProps = {
  region: Region
  mapRef?: RefObject<MapRef | null>
}

const TREND_UI: Record<TrendDirection, { Icon: typeof TrendingUp }> = {
  naik: { Icon: TrendingUp },
  turun: { Icon: TrendingDown },
  stabil: { Icon: Minus },
}
const TREND_LABEL = (d: TrendDirection) =>
  ({
    naik: getCopy().detail.trendUp,
    turun: getCopy().detail.trendDown,
    stabil: getCopy().detail.trendFlat,
  })[d]

function chartTone(risk: RiskCategory): 'chart' | 'risk-high' | 'risk-mid' | 'risk-low' {
  if (risk === 'sangat_tinggi') return 'risk-high'
  if (risk === 'sedang') return 'risk-mid'
  if (risk === 'rendah') return 'risk-low'
  return 'chart'
}

// shortcut: API `saran` masih teks bebas berbahasa Indonesia — petakan kalimat baku yang dikenal.
// Upgrade: backend kirim kode saran, FE yang memilih bahasa.
const KNOWN_ACTION_API: Record<string, 'actionNoBurn' | 'actionReduceSmoke'> = {
  'jangan membakar lahan, sampah, atau membuang puntung rokok sembarangan':
    'actionNoBurn',
  'jangan membakar lahan atau sampah, dan jangan buang puntung rokok sembarangan':
    'actionNoBurn',
  'kurangi aktivitas di luar bila ada asap dan ikuti informasi kualitas udara resmi':
    'actionReduceSmoke',
  'kalau ada asap, kurangi aktivitas di luar dan ikuti info kualitas udara resmi':
    'actionReduceSmoke',
}

function sanitizeAction(text: string): string {
  const lower = text.toLowerCase()
  if (
    lower.includes('verifikasi ketersediaan nomor') ||
    lower.includes('tampilkan atribusi')
  ) {
    return getCopy().detail.actionFireContact
  }
  const key = text.trim().replace(/\.$/, '').toLowerCase()
  const known = KNOWN_ACTION_API[key]
  if (known) return getCopy().detail[known]
  if (getLocale() === 'en') {
    if (key === 'jika melihat asap atau api, hubungi 112 atau bpbd setempat') {
      return getCopy().detail.actionFireContact
    }
    if (key.startsWith('cek lagi nanti')) return getCopy().detail.actionCheckLater
  }
  return text
}

function ActionText({ text }: { text: string }) {
  const parts = text.split(/(112|113)/g)
  return (
    <>
      {parts.map((part, i) =>
        part === '112' || part === '113' ? (
          <a
            key={i}
            href={`tel:${part}`}
            className="text-risk-low font-semibold underline underline-offset-2 hover:opacity-80"
          >
            {part}
          </a>
        ) : (
          part
        ),
      )}
    </>
  )
}

/** Satu sel metrik — label 12 + nilai 14, sama di seluruh kartu. */
function ConditionCell({
  icon,
  label,
  value,
  iconClass,
}: {
  icon: ReactNode
  label: string
  value: ReactNode | null
  iconClass?: string
}) {
  if (value == null) return null
  return (
    <div className="flex items-start gap-2">
      <span
        className={cn('text-brand mt-1 shrink-0 [&>svg]:size-4', iconClass)}
        aria-hidden
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <p className={T.fieldLabel}>{label}</p>
        <p className={cn(T.title, 'tabular-nums')}>{value}</p>
      </div>
    </div>
  )
}

function ConditionsCard({ region }: { region: Region }) {
  const [lon, lat] = region.center
  const windy = useWindyForecast(lat, lon)
  const discharge = useRiverDischarge(region.code)
  const windyPoint = nearestWindyPoint(windy.data?.data.titik)
  const tempValue = region.weather.temp_c ?? windyPoint?.suhu_c ?? null
  const humidityValue = region.weather.humidity ?? windyPoint?.kelembapan ?? null
  const windValue = region.weather.wind_kmh ?? windyPoint?.kecepatan_angin_kmj ?? null
  const gustValue = windyPoint?.hembusan_kmj ?? null
  const rainValue =
    windyPoint?.curah_hujan_3j_mm != null && Number.isFinite(windyPoint.curah_hujan_3j_mm)
      ? windyPoint.curah_hujan_3j_mm
      : null
  const temp =
    tempValue != null ? `${formatNumber(tempValue)}${getCopy().detail.tempUnit}` : null
  const humidity = humidityValue != null ? `${formatNumber(humidityValue)}%` : null
  const wind =
    windValue != null ? `${formatNumber(windValue)} ${getCopy().detail.windUnit}` : null
  const gust =
    gustValue != null ? `${formatNumber(gustValue)} ${getCopy().detail.windUnit}` : null
  const rain =
    rainValue != null ? `${formatNumber(rainValue)} ${getCopy().detail.rainUnit}` : null
  const dryDays =
    region.weather.dry_days != null
      ? `${formatNumber(region.weather.dry_days)} ${getCopy().detail.dayUnit}`
      : null
  const weatherDanger = region.weather_danger
    ? `${getCopy().bahaya[region.weather_danger.class]} (${formatNumber(region.weather_danger.fwi)})`
    : null
  const pm25 = airPm25Value(region)
  const riverValues = discharge.data?.data.debit_m3_detik
  const riverDates = discharge.data?.data.tanggal_utc
  const river = latestDischargeM3s(riverValues)
  const riverSpark = dischargeSeries(riverValues)
  const riverLabel =
    river != null ? `${formatNumber(river)} ${getCopy().detail.riverDischargeUnit}` : null
  const riverMin = riverSpark.length ? Math.min(...riverSpark) : null
  const riverMax = riverSpark.length ? Math.max(...riverSpark) : null
  const riverDayFirst = riverDates?.[0]?.slice(8, 10)
  const riverDayLast = riverDates?.at(-1)?.slice(8, 10)
  const hasMetrics = !!(
    temp ||
    humidity ||
    wind ||
    gust ||
    rain ||
    dryDays ||
    weatherDanger ||
    pm25 ||
    riverLabel
  )

  return (
    <Card aria-label={getCopy().detail.conditions}>
      <CardHeader>
        <div className="flex min-w-0 items-center gap-1">
          <CardTitle>{getCopy().detail.conditions}</CardTitle>
          <InfoTooltip
            label={getCopy().detail.weatherSourceHint}
            content={getCopy().detail.weatherSourceNote}
          />
        </div>
        <AirCategoryPill region={region} />
      </CardHeader>
      <CardContent className="space-y-4">
        {hasMetrics ? (
          <div className="grid grid-cols-1 gap-4 min-[360px]:grid-cols-2">
            <ConditionCell
              icon={<Thermometer strokeWidth={2} />}
              iconClass="panel-icon-sun"
              label={getCopy().detail.temp}
              value={temp}
            />
            <ConditionCell
              icon={<Droplets strokeWidth={2} />}
              iconClass="panel-icon-drip"
              label={getCopy().detail.humidity}
              value={humidity}
            />
            <ConditionCell
              icon={<Wind strokeWidth={2} />}
              iconClass="panel-icon-breeze"
              label={getCopy().detail.wind}
              value={wind}
            />
            <ConditionCell
              icon={<Wind strokeWidth={2} />}
              iconClass="panel-icon-breeze"
              label={getCopy().detail.windGust}
              value={gust}
            />
            <ConditionCell
              icon={<CloudRain strokeWidth={2} />}
              iconClass="panel-icon-drip"
              label={getCopy().detail.rain3h}
              value={rain}
            />
            <ConditionCell
              icon={<Sun strokeWidth={2} />}
              iconClass="panel-icon-sun"
              label={getCopy().detail.dryDays}
              value={dryDays}
            />
            <ConditionCell
              icon={<Gauge strokeWidth={2} />}
              iconClass="panel-icon-gauge"
              label={getCopy().detail.weatherDanger}
              value={weatherDanger}
            />
            <ConditionCell
              icon={<CloudFog strokeWidth={2} />}
              iconClass="panel-icon-breeze"
              label={getCopy().detail.airPm25}
              value={pm25}
            />
            <ConditionCell
              icon={<Waves strokeWidth={2} />}
              iconClass="panel-icon-drip"
              label={getCopy().detail.riverDischarge}
              value={riverLabel}
            />
          </div>
        ) : null}
        {riverSpark.length >= 2 ? (
          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <p className={T.fieldLabel}>{getCopy().detail.riverDischargeChart}</p>
              {riverMin != null && riverMax != null ? (
                <p className={cn(T.quiet, 'font-mono tabular-nums')}>
                  {formatNumber(riverMin)}–{formatNumber(riverMax)}{' '}
                  {getCopy().detail.riverDischargeUnit}
                </p>
              ) : null}
            </div>
            <Sparkline
              data={riverSpark}
              width={280}
              height={40}
              smooth={false}
              className="text-chart h-10 w-full max-w-full"
              ariaLabel={getCopy().detail.riverDischargeChart}
            />
            {riverDayFirst && riverDayLast ? (
              <div className="text-ink-3 flex justify-between text-xs leading-4">
                <span>{riverDayFirst}</span>
                <span>{riverDayLast}</span>
              </div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

/** Daftar laporan warga di detail wilayah — tulis laporan hanya dari pin card. */
export function CitizenReportsCard({ regionCode }: { regionCode: string }) {
  const setSelectedReportId = useUiStore((s) => s.setSelectedReportId)
  const setPanelOpen = useUiStore((s) => s.setPanelOpen)
  const { data: regionReports = [], isPending: reportsPending } =
    useRegionReports(regionCode)

  const latest = regionReports.slice(0, 6)

  const openDetail = (el: HTMLElement, id: string) => {
    rememberFocusTrigger(el)
    setSelectedReportId(id)
    setPanelOpen(true)
  }

  return (
    <Card aria-label={getCopy().report.panelTitle}>
      <CardHeader className="items-start">
        <div className="min-w-0 flex-1 space-y-1">
          <CardTitle>{getCopy().report.panelTitle}</CardTitle>
          <p className={T.quiet}>{getCopy().report.panelHint}</p>
        </div>
        {regionReports.length > 0 ? (
          <span className="text-ink-2 shrink-0 text-xs leading-4 tabular-nums">
            {getCopy().report.badge(String(regionReports.length))}
          </span>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {reportsPending ? (
          <p className="text-ink-2 text-sm leading-5">{getCopy().common.loading}</p>
        ) : latest.length === 0 ? (
          <p className="text-ink-2 text-sm leading-5">{getCopy().report.panelEmpty}</p>
        ) : (
          <ul className="-mx-1" aria-label={getCopy().report.panelLatest}>
            {latest.map((r, i) => (
              <li key={r.id} className={cn(i > 0 && 'border-line border-t')}>
                <CitizenReportReview
                  report={r}
                  variant="compact"
                  onSelect={(el) => openDetail(el, r.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

/** Detail wilayah — hierarki: hero angka → meta → tren → deteksi; kartu lain seragam. */
export function RegionDetailPanel({ region, mapRef }: RegionDetailPanelProps) {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const select = useMapStore((s) => s.select)
  const province = useMapStore((s) => s.province)
  const panelOpen = useUiStore((s) => s.panelOpen)
  const history = useRegionHistory(region.code)
  const trendValues = useMemo(
    () => trendValuesFromHistory(history.data, region.trend_7d),
    [history.data, region.trend_7d],
  )
  const skor =
    latestHistoryScore(history.data) ??
    (region.score != null && Number.isFinite(region.score) ? region.score : null)

  const risk = effectiveRiskCategory(region)
  const trend = hotspotTrend(trendValues)
  const { Icon: TrendIcon } = TREND_UI[trend]
  const trendLabel = TREND_LABEL(trend)
  const actions =
    region.actions.length > 0
      ? region.actions.slice(0, 3).map(sanitizeAction)
      : [getCopy().detail.actionCheckLater, getCopy().detail.actionFireContact]

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
      <div
        className={cn(
          PANEL.stickyHeader,
          PANEL.pad,
          PANEL.header,
          'flex items-center gap-2',
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-1">
          <h1
            ref={titleRef}
            tabIndex={-1}
            className={cn(T.title, 'min-w-0 truncate outline-none')}
            title={region.name}
          >
            {region.name}
          </h1>
          <InfoTooltip
            label={getCopy().detail.riskHint}
            content={getCopy().detail.riskTooltip}
          />
        </div>
        <HotspotStatusBadge
          hotspots={region.hotspots_24h}
          riskCategory={region.risk_category}
        />
        <ShareWilayahButton name={region.name} code={region.code} variant="icon" />
        <CloseIconButton onClick={handleBack} aria-label={getCopy().panel.closeDetail}>
          <X className="size-4 shrink-0" strokeWidth={2} aria-hidden />
        </CloseIconButton>
      </div>

      <div className={cn(PANEL.body, PANEL.pad)}>
        <DataFreshnessBanner />

        <Card aria-label={region.name}>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <p className={cn(T.display, 'font-mono')}>
                {formatNumber(region.hotspots_24h)}
              </p>
              <p className={T.body}>{getCopy().detail.hotspotUnitLine}</p>
            </div>

            <div className={cn(T.quiet, 'space-y-1')}>
              <p>{getCopy().map.regionMetaProvince(region.province)}</p>
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="inline-flex items-center gap-2">
                  <TrendIcon
                    className="text-brand size-3.5 shrink-0"
                    strokeWidth={2}
                    aria-hidden
                  />
                  <span>
                    {trendLabel} {getCopy().detail.trendVsPrevious}
                  </span>
                </span>
                {skor != null ? (
                  <>
                    <span className="text-ink-3" aria-hidden>
                      ·
                    </span>
                    <span className="font-mono font-semibold tabular-nums">
                      {getCopy().detail.scoreToday(formatNumber(skor))}
                    </span>
                  </>
                ) : null}
              </p>
            </div>

            <TrendChart
              values={trendValues}
              timeZone={region.time_zone}
              tone={chartTone(risk)}
              description={null}
            />
          </CardContent>
        </Card>

        <CitizenReportsCard regionCode={region.code} />

        <ConditionsCard region={region} />

        <Card>
          <SectionHead title={getCopy().detail.actions} />
          <CardContent>
            <ul className="space-y-3">
              {actions.map((act, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check
                    className="text-brand mt-1 size-4 shrink-0"
                    strokeWidth={2}
                    aria-hidden
                  />
                  <span className={T.body}>
                    <ActionText text={act} />
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <OfficialRefsCard />
      </div>
    </div>
  )
}
