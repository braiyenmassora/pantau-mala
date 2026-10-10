import { useState } from 'react'
import { Flame } from 'lucide-react'

import { focusRing } from '@/components/common/focus-ring'
import { MapMarker, MarkerContent, useMap } from '@/components/ui/map'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { copy } from '@/copy/id'
import type { Region, RiskCategory } from '@/data/types'
import { rememberFocusTrigger } from '@/lib/focus-return'
import {
  haloDiameter,
  showHalo as shouldShowHalo,
  showHaloPulse,
} from '@/lib/halo'
import { getMapPadding } from '@/lib/indonesia-view'
import { usePrefersReducedMotion } from '@/lib/prefers-reduced-motion'
import {
  PIN_ACTIVE_BOX_SHADOW,
  RISK_CATEGORIES,
  withAlpha,
} from '@/lib/risk-category'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

type RegionPinProps = {
  region: Region
  /** When false, hide the hotspot-count halo (e.g. zoom ≥ 7 with area polygons). */
  showHalo?: boolean
}

const ACTIVE_PIN: Record<RiskCategory, string> = {
  sangat_tinggi: 'border-[1.5px] border-risk-high bg-risk-high-tint',
  sedang: 'border-[1.5px] border-risk-mid bg-risk-mid-tint',
  rendah: 'border-[1.5px] border-risk-low bg-risk-low-tint',
}

function PinGlyph({ kategori }: { kategori: RiskCategory }) {
  if (kategori === 'rendah') {
    return <span className="size-2 rounded-full bg-risk-low" aria-hidden />
  }
  return (
    <Flame
      className={cn(
        'size-4',
        kategori === 'sangat_tinggi'
          ? 'fill-risk-high stroke-risk-high'
          : 'fill-risk-mid stroke-risk-mid',
      )}
      strokeWidth={2}
      aria-hidden
    />
  )
}

export function RegionPin({ region, showHalo = true }: RegionPinProps) {
  const { map } = useMap()
  const reducedMotion = usePrefersReducedMotion()
  const selectedCode = useMapStore((s) => s.selectedCode)
  const hoveredCode = useMapStore((s) => s.hoveredCode)
  const select = useMapStore((s) => s.select)
  const hover = useMapStore((s) => s.hover)
  const panelOpen = useUiStore((s) => s.panelOpen)
  const [tipOpen, setTipOpen] = useState(false)

  const style = RISK_CATEGORIES[region.kategori]
  const selected = selectedCode === region.kode
  const active = selected || hoveredCode === region.kode
  const circle = showHalo && shouldShowHalo(region.titik_panas_24j)
  const pulse = circle && showHaloPulse(region.kategori)
  const haloSize = haloDiameter(region.titik_panas_24j)
  const pulseClass =
    region.kategori === 'sangat_tinggi' ? 'animate-halo-high' : 'animate-halo-mid'
  const label = copy.map.pinAria(region.nama, style.label, region.skor)

  return (
    <MapMarker
      longitude={region.pusat[0]}
      latitude={region.pusat[1]}
      anchor="center"
      onMouseEnter={() => hover(region.kode)}
      onMouseLeave={() => hover(null)}
    >
      <MarkerContent
        className={cn('relative flex items-center justify-center', active ? 'z-20' : 'z-10')}
      >
        {circle && (
          <span
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
            style={{
              width: haloSize,
              height: haloSize,
              backgroundColor: withAlpha(style.dot, 0.1),
              borderColor: withAlpha(style.dot, 0.24),
            }}
          />
        )}
        {pulse && (
          <span
            aria-hidden
            className={cn(
              'pointer-events-none absolute top-1/2 left-1/2 rounded-full border',
              pulseClass,
            )}
            style={{
              width: haloSize,
              height: haloSize,
              borderColor: withAlpha(style.dot, 0.35),
            }}
          />
        )}

        <Tooltip
          delayDuration={150}
          open={selected ? false : tipOpen}
          onOpenChange={(open) => {
            if (!selected) setTipOpen(open)
          }}
        >
          <TooltipTrigger asChild>
            <button
              type="button"
              className={cn(
                'relative flex size-7 items-center justify-center rounded-full border border-line bg-surface shadow-map',
                'origin-center transition-[transform,box-shadow,background-color,border-color] duration-150 ease-in-out',
                focusRing,
                active && cn('scale-110', ACTIVE_PIN[region.kategori]),
              )}
              style={active ? { boxShadow: PIN_ACTIVE_BOX_SHADOW } : undefined}
              aria-label={label}
              onClick={(e) => {
                e.stopPropagation()
                rememberFocusTrigger(e.currentTarget)
                select(region.kode)
                map?.flyTo({
                  center: region.pusat,
                  zoom: 8,
                  padding: getMapPadding(panelOpen),
                  duration: reducedMotion ? 0 : 600,
                })
              }}
            >
              <PinGlyph kategori={region.kategori} />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            sideOffset={8}
            className="rounded-ctl bg-ink px-2 py-1 text-xs text-surface"
          >
            {copy.map.pinTooltip(region.nama)}{' '}
            <span className="font-mono">{region.skor}</span>
          </TooltipContent>
        </Tooltip>
      </MarkerContent>
    </MapMarker>
  )
}
