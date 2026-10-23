import {
  Check,
  CloudFog,
  Droplets,
  Gauge,
  MessageSquarePlus,
  Minus,
  Sun,
  TrendingDown,
  TrendingUp,
  Wind,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, type ReactNode, type RefObject } from 'react'

import {
  Button,
  HotspotStatusBadge,
  IconButton,
  InfoTooltip,
  TrendChart,
} from '@/components/common'
import { AirCategoryPill } from '@/components/panel/air-quality-card'
import { airPm25Value } from '@/lib/air-card'
import { SectionHead } from '@/components/common/section-head'
import { CitizenReportReview } from '@/components/panel/citizen-report-review'
import { DataFreshnessBanner } from '@/components/panel/data-freshness-banner'
import { OfficialRefsCard } from '@/components/panel/official-refs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { MapRef } from '@/components/ui/map'
import { getCopy, getLocale } from '@/copy'
import { useRegionReports } from '@/data/hotspot-reports'
import { useHotspots } from '@/data/queries'
import type { Region, RiskCategory } from '@/data/types'
import { rememberFocusTrigger, restoreFocusTrigger } from '@/lib/focus-return'
import { formatNumber } from '@/lib/format'
import { hotspotTrend, type TrendDirection } from '@/lib/hotspot-trend'
import { fitIndonesia } from '@/lib/indonesia-view'
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
const KNOWN_ACTION_EN: Record<string, string> = {
  'jangan membakar lahan, sampah, atau membuang puntung rokok sembarangan':
    'Do not burn land or trash, and do not carelessly throw away cigarette butts.',
  'kurangi aktivitas di luar bila ada asap dan ikuti informasi kualitas udara resmi':
    'Reduce outdoor activities when there is smoke and follow official air quality information.',
}

function sanitizeAction(text: string): string {
  const lower = text.toLowerCase()
  if (
    lower.includes('verifikasi ketersediaan nomor') ||
    lower.includes('tampilkan atribusi')
  ) {
    return getCopy().detail.actionFireContact
  }
  if (getLocale() === 'en') {
    const key = text.trim().replace(/\.$/, '').toLowerCase()
    if (KNOWN_ACTION_EN[key]) return KNOWN_ACTION_EN[key]
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
        className={cn('text-ink-2 mt-1 shrink-0 [&>svg]:size-4', iconClass)}
        aria-hidden
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-ink-2 text-xs leading-4 font-medium">{label}</p>
        <p className="text-ink text-sm leading-5 font-semibold tabular-nums">{value}</p>
      </div>
    </div>
  )
}

function ConditionsCard({ region }: { region: Region }) {
  const humidity =
    region.weather.humidity != null ? `${formatNumber(region.weather.humidity)}%` : null
  const wind =
    region.weather.wind_kmh != null
      ? `${formatNumber(region.weather.wind_kmh)} ${getCopy().detail.windUnit}`
      : null
  const dryDays =
    region.weather.dry_days != null
      ? `${formatNumber(region.weather.dry_days)} ${getCopy().detail.dayUnit}`
      : null
  const weatherDanger = region.weather_danger
    ? `${getCopy().bahaya[region.weather_danger.class]} (${formatNumber(region.weather_danger.fwi)})`
    : null
  const pm25 = airPm25Value(region)
  const hasMetrics = !!(humidity || wind || dryDays || weatherDanger || pm25)

  return (
    <Card aria-label={getCopy().detail.conditions}>
      <CardHeader>
        <div className="flex min-w-0 items-center gap-1">
          <CardTitle>{getCopy().detail.conditions}</CardTitle>
          <InfoTooltip content={getCopy().detail.weatherSourceNote} />
        </div>
        <AirCategoryPill region={region} />
      </CardHeader>
      <CardContent>
        {hasMetrics ? (
          <div className="grid grid-cols-1 gap-4 min-[360px]:grid-cols-2">
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
              label={getCopy().detail.airPm25}
              value={pm25}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

/** canCompose: dari hitungan wilayah (tersedia segera). Titik GeoJSON bisa datang belakangan. */
export function CitizenReportsCard({
  regionCode,
  canCompose = false,
}: {
  regionCode: string
  canCompose?: boolean
}) {
  const setReportTarget = useUiStore((s) => s.setReportTarget)
  const setSelectedReportId = useUiStore((s) => s.setSelectedReportId)
  const setPanelOpen = useUiStore((s) => s.setPanelOpen)
  const { data, isPending: hotspotsPending } = useHotspots()
  const { data: regionReports = [], isPending: reportsPending } =
    useRegionReports(regionCode)

  const hotspots = useMemo(() => {
    if (!data) return []
    return data.features.filter((f) => f.properties.region_code === regionCode)
  }, [data, regionCode])

  const latest = regionReports.slice(0, 6)
  const composeReady = hotspots.length > 0

  const openDetail = (el: HTMLElement, id: string) => {
    rememberFocusTrigger(el)
    setSelectedReportId(id)
    setPanelOpen(true)
  }

  const openComposer = (el: HTMLElement) => {
    const f = hotspots[0]
    if (!f) return
    const [lon, lat] = f.geometry.coordinates
    rememberFocusTrigger(el)
    setReportTarget({
      lat,
      lon,
      region_code: f.properties.region_code,
      hotspot_time: f.properties.time,
    })
    setPanelOpen(true)
  }

  return (
    <Card aria-label={getCopy().report.panelTitle}>
      <CardHeader>
        <div className="flex min-w-0 items-center gap-1">
          <CardTitle>{getCopy().report.panelTitle}</CardTitle>
          {canCompose ? (
            <InfoTooltip content={getCopy().report.panelContributeHint} />
          ) : null}
        </div>
        {regionReports.length > 0 ? (
          <span className="text-ink shrink-0 text-xs leading-4 font-semibold tabular-nums">
            {getCopy().report.badge(String(regionReports.length))}
          </span>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-ink-2 text-xs leading-4">{getCopy().report.panelHint}</p>
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
        {canCompose ? (
          <Button
            variant="soft"
            className="w-full"
            onClick={(e) => openComposer(e.currentTarget)}
            disabled={!composeReady}
            loading={hotspotsPending && !composeReady}
          >
            <MessageSquarePlus
              className="panel-icon-report size-3.5"
              strokeWidth={2}
              aria-hidden
            />
            {getCopy().report.panelOpen}
          </Button>
        ) : null}
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

  const risk = effectiveRiskCategory(region)
  const trend = hotspotTrend(region.trend_7d)
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
      <div className="border-line bg-surface sticky top-0 z-10 flex items-center gap-2 border-b px-4 pt-2 pb-2">
        <div className="flex min-w-0 flex-1 items-center gap-1">
          <h1
            ref={titleRef}
            tabIndex={-1}
            className="text-ink min-w-0 truncate text-sm leading-5 font-semibold outline-none"
            title={region.name}
          >
            {region.name}
          </h1>
          <InfoTooltip content={getCopy().detail.riskTooltip} />
        </div>
        <HotspotStatusBadge
          hotspots={region.hotspots_24h}
          riskCategory={region.risk_category}
        />
        <IconButton onClick={handleBack} aria-label={getCopy().panel.closeDetail}>
          <X className="size-4 shrink-0" strokeWidth={2} aria-hidden />
        </IconButton>
      </div>

      <div className="flex flex-col gap-6 px-4 pt-3 pb-6">
        <DataFreshnessBanner />

        <Card aria-label={region.name}>
          <CardContent className="space-y-3 pt-4">
            <div className="space-y-1">
              <p className="text-ink font-mono text-3xl leading-10 font-semibold tabular-nums">
                {formatNumber(region.hotspots_24h)}
              </p>
              <p className="text-ink text-sm leading-5">
                {getCopy().detail.hotspotUnitLine}
              </p>
            </div>

            <div className="text-ink-2 space-y-1 text-xs leading-4">
              <p>{getCopy().map.regionMetaProvince(region.province)}</p>
              <p className="flex items-center gap-2">
                <TrendIcon
                  className={cn(
                    'size-3.5 shrink-0',
                    trend === 'naik' && 'panel-icon-trend-up',
                    trend === 'turun' && 'panel-icon-trend-down',
                  )}
                  strokeWidth={2}
                  aria-hidden
                />
                <span>
                  {trendLabel} {getCopy().detail.trendVsPrevious}
                </span>
              </p>
            </div>

            <TrendChart
              values={region.trend_7d}
              timeZone={region.time_zone}
              tone={chartTone(risk)}
              description={null}
            />
          </CardContent>
        </Card>

        <CitizenReportsCard
          regionCode={region.code}
          canCompose={typeof region.hotspots_24h === 'number' && region.hotspots_24h > 0}
        />

        <ConditionsCard region={region} />

        <Card>
          <SectionHead title={getCopy().detail.actions} />
          <CardContent>
            <ul className="space-y-3">
              {actions.map((act, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check
                    className="panel-icon-check text-risk-low mt-1 size-4 shrink-0"
                    strokeWidth={2}
                    aria-hidden
                  />
                  <span className="text-ink text-sm leading-5">
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
