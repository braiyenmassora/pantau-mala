import bbox from '@turf/bbox'
import { featureCollection } from '@turf/helpers'
import {
  Check,
  Cloud,
  CloudFog,
  CloudRain,
  Droplets,
  Flame,
  Info,
  MapPin,
  Wind,
} from 'lucide-react'
import { useEffect, useMemo, useRef, type RefObject } from 'react'

import { DataTile, SectionLabel } from '@/components/common'
import { focusRing } from '@/components/common/focus-ring'
import { Sparkline } from '@/components/panel/sparkline'
import type { MapRef } from '@/components/ui/map'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useHotspotAreas, useMeta } from '@/data/queries'
import type { AirQualityCategory, ConfidenceLevel, Region } from '@/data/types'
import { copy } from '@/copy/id'
import {
  formatCoordinates,
  formatDateTime,
  formatNumber,
  trendWindowLabels,
} from '@/lib/format'
import { getMapPadding } from '@/lib/indonesia-view'
import { usePrefersReducedMotion } from '@/lib/prefers-reduced-motion'
import { RISK_CATEGORIES } from '@/lib/risk-category'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/store/ui'

const CONFIDENCE_LABEL: Record<ConfidenceLevel, string> = copy.confidence

const AIR_LABEL: Record<AirQualityCategory, string> = copy.air

const AIR_TEXT: Record<AirQualityCategory, string> = {
  baik: 'text-risk-low-text',
  sedang: 'text-risk-mid-text',
  tidak_sehat: 'text-risk-high-text',
}

type RegionDetailPanelProps = {
  region: Region
  mapRef?: RefObject<MapRef | null>
}

export function RegionDetailPanel({ region, mapRef }: RegionDetailPanelProps) {
  const { data: meta } = useMeta()
  const { data: areas } = useHotspotAreas()
  const panelOpen = useUiStore((s) => s.panelOpen)
  const reducedMotion = usePrefersReducedMotion()
  const titleRef = useRef<HTMLHeadingElement>(null)
  const style = RISK_CATEGORIES[region.kategori]
  const [lon, lat] = region.pusat
  const trendStart = region.tren_7h[0] ?? 0
  const trendEnd = region.tren_7h[region.tren_7h.length - 1] ?? 0
  const dates = trendWindowLabels(meta?.diperbarui ?? new Date().toISOString())
  const showSpark =
    region.tren_7h.length >= 2 && !region.tren_7h.every((v) => v === 0)

  const regionAreas = useMemo(
    () =>
      (areas?.features ?? []).filter(
        (f) => f.properties.kode_wilayah === region.kode,
      ),
    [areas, region.kode],
  )
  const areaCount = regionAreas.length
  const areaKmTotal = regionAreas.reduce(
    (sum, f) => sum + f.properties.luas_km2,
    0,
  )

  useEffect(() => {
    titleRef.current?.focus()
  }, [region.kode])

  function fitRegionAreas() {
    if (!mapRef?.current || regionAreas.length === 0) return
    const [west, south, east, north] = bbox(featureCollection(regionAreas))
    mapRef.current.fitBounds(
      [
        [west, south],
        [east, north],
      ],
      {
        padding: getMapPadding(panelOpen),
        duration: reducedMotion ? 0 : 600,
        maxZoom: 12,
      },
    )
  }

  return (
    <div key={region.kode} className="animate-view-in space-y-6">
      <div className="space-y-4">
        <header>
          <h2
            ref={titleRef}
            tabIndex={-1}
            className={cn(
              'line-clamp-2 text-xl font-semibold text-ink outline-none',
              focusRing,
              'rounded-ctl',
            )}
            title={region.nama}
          >
            {region.nama}
          </h2>
          <p className="mt-1 flex items-center gap-1 text-sm text-ink-2">
            <MapPin className="size-4 shrink-0 text-ink-2" strokeWidth={2} aria-hidden />
            <span>
              {region.provinsi}
              {' · '}
              <span className="font-mono text-xs">
                {formatCoordinates(lon, lat)}
              </span>
            </span>
          </p>
        </header>
        <RiskCard region={region} />
      </div>

      <section className="space-y-2">
        <SectionLabel>{copy.detail.summary}</SectionLabel>
        <p className="text-base text-ink" style={{ lineHeight: '22px' }}>
          {region.ringkasan}
        </p>
      </section>

      <section className="space-y-2">
        <SectionLabel>{copy.detail.actions}</SectionLabel>
        <div className="rounded-card bg-surface-muted p-4">
          <ul className="space-y-2">
            {region.saran.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Check
                  className="mt-1 size-4 shrink-0 text-brand"
                  strokeWidth={2}
                  aria-hidden
                />
                <span className="text-base text-ink">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="space-y-2">
        <SectionLabel>{copy.detail.conditions}</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          <DataTile
            icon={<Flame className="size-4 text-ink-2" strokeWidth={2} />}
            label={copy.panel.hotspot24h}
            value={formatNumber(region.titik_panas_24j)}
            unit={copy.detail.hotspotUnit}
          />
          <DataTile
            icon={<Cloud className="size-4 text-ink-2" strokeWidth={2} />}
            label={copy.source.cuaca}
            value={`${formatNumber(region.cuaca.suhu_c)}°C`}
            unit={region.cuaca.kondisi}
          />
          <DataTile
            icon={<Droplets className="size-4 text-ink-2" strokeWidth={2} />}
            label={copy.detail.humidity}
            value={formatNumber(region.cuaca.kelembapan)}
            unit="%"
          />
          <DataTile
            icon={<Wind className="size-4 text-ink-2" strokeWidth={2} />}
            label={copy.detail.wind}
            value={formatNumber(region.cuaca.angin_kmj)}
            unit={copy.detail.windUnit}
          />
          <DataTile
            icon={<CloudRain className="size-4 text-ink-2" strokeWidth={2} />}
            label={copy.detail.dryDays}
            value={formatNumber(region.cuaca.hari_tanpa_hujan)}
            unit={copy.detail.dayUnit}
          />
          <DataTile
            icon={<CloudFog className="size-4 text-ink-2" strokeWidth={2} />}
            label={copy.detail.airPm25}
            value={AIR_LABEL[region.udara.kategori]}
            valueClassName={AIR_TEXT[region.udara.kategori]}
          />
        </div>
      </section>

      {areaCount > 0 && (
        <section className="space-y-2">
          <SectionLabel>{copy.area.section}</SectionLabel>
          <button
            type="button"
            onClick={fitRegionAreas}
            className={cn(
              'w-full rounded-card bg-surface-muted px-4 py-3 text-left',
              'transition-colors duration-150 ease-in-out hover:bg-line/60',
              focusRing,
            )}
          >
            <p className="text-base font-semibold text-ink">
              {copy.area.summary(
                formatNumber(areaCount),
                formatNumber(Math.round(areaKmTotal * 10) / 10, {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                }),
              )}
            </p>
          </button>
        </section>
      )}

      <section className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <SectionLabel>{copy.detail.trend7d}</SectionLabel>
          <p className="font-mono text-sm tabular-nums text-ink-2">
            {copy.detail.trendRange(
              formatNumber(trendStart),
              formatNumber(trendEnd),
            )}
          </p>
        </div>
        {showSpark && (
          <>
            <Sparkline
              values={region.tren_7h}
              width={336}
              height={64}
              color={style.dot}
              showBaseline
              className="h-16 w-full"
            />
            <div className="flex justify-between text-xs text-ink-2">
              <span>{dates.start}</span>
              <span>{dates.end}</span>
            </div>
          </>
        )}
      </section>

      {region.deteksi_terakhir && (
        <section>
          <SectionLabel className="mb-2">{copy.panel.techTitle}</SectionLabel>
          <div className="divide-y divide-line rounded-card border border-line bg-surface">
            <TechRow
              label={copy.panel.techTime}
              value={formatDateTime(
                region.deteksi_terakhir.waktu,
                region.zona_waktu,
              )}
            />
            <TechRow
              label={copy.panel.techSatellite}
              value={region.deteksi_terakhir.satelit}
            />
            <TechRow
              label={copy.panel.techConfidence}
              value={CONFIDENCE_LABEL[region.deteksi_terakhir.keyakinan]}
            />
            <TechRow
              label={copy.panel.techFrp}
              value={`${formatNumber(region.deteksi_terakhir.frp_mw, {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })} MW`}
              mono
            />
          </div>
        </section>
      )}
    </div>
  )
}

function RiskCard({ region }: { region: Region }) {
  const style = RISK_CATEGORIES[region.kategori]
  const markerLeft = `${Math.min(100, Math.max(0, region.skor))}%`

  return (
    <section
      className="space-y-3 rounded-card p-4"
      style={{ backgroundColor: style.tint, color: style.text }}
    >
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-1">
            <p className="text-xs font-medium">{copy.detail.riskTitle}</p>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    'opacity-70 transition-opacity duration-150 ease-in-out hover:opacity-100',
                    focusRing,
                    'rounded-ctl',
                  )}
                  aria-label={copy.detail.riskHint}
                  style={{ color: style.text }}
                >
                  <Info className="size-3.5" strokeWidth={2} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs rounded-ctl">
                {copy.detail.riskTooltip}
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="mt-1 text-xl font-semibold">{style.label}</p>
        </div>
        <div className="flex items-baseline gap-1">
          <p className="font-mono text-3xl font-semibold tracking-[-0.02em] text-ink">
            {region.skor}
          </p>
          <span className="text-sm" style={{ color: style.text }}>
            /100
          </span>
        </div>
      </div>

      <div className="relative pt-2">
        <div className="flex" style={{ gap: 2, height: 6 }}>
          <span className="h-full flex-[34] rounded-l-full bg-risk-low" />
          <span className="h-full flex-[33] bg-risk-mid" />
          <span className="h-full flex-[33] rounded-r-full bg-risk-high" />
        </div>
        <span
          className="absolute size-3 -translate-x-1/2 rounded-full border-2 border-ink bg-surface"
          style={{ left: markerLeft, top: 2 }}
          aria-hidden
        />
        <div className="mt-2 flex justify-between text-xs">
          <span className="text-risk-low-text">
            {RISK_CATEGORIES.rendah.label}
          </span>
          <span className="text-risk-mid-text">
            {RISK_CATEGORIES.sedang.label}
          </span>
          <span className="text-risk-high-text">
            {RISK_CATEGORIES.sangat_tinggi.label}
          </span>
        </div>
      </div>
    </section>
  )
}

function TechRow({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-3 py-2">
      <span className="text-sm text-ink-2">{label}</span>
      <span
        className={cn(
          'text-right text-sm font-medium text-ink',
          mono && 'font-mono',
        )}
      >
        {value}
      </span>
    </div>
  )
}
