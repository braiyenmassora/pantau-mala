import type { RefObject } from 'react'

import { focusRing } from '@/components/common/focus-ring'
import { Sparkline } from '@/components/panel/sparkline'
import type { MapRef } from '@/components/ui/map'
import type { Region } from '@/data/types'
import { formatNumber } from '@/lib/format'
import { getMapPadding } from '@/lib/indonesia-view'
import { usePrefersReducedMotion } from '@/lib/prefers-reduced-motion'
import { RISK_CATEGORIES } from '@/lib/risk-category'
import { trendLabel } from '@/lib/trend'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

type RegionRowProps = {
  region: Region
  mapRef: RefObject<MapRef | null>
}

export function RegionRow({ region, mapRef }: RegionRowProps) {
  const hoveredCode = useMapStore((s) => s.hoveredCode)
  const selectedCode = useMapStore((s) => s.selectedCode)
  const hover = useMapStore((s) => s.hover)
  const select = useMapStore((s) => s.select)
  const panelOpen = useUiStore((s) => s.panelOpen)
  const reducedMotion = usePrefersReducedMotion()
  const style = RISK_CATEGORIES[region.kategori]
  const active = hoveredCode === region.kode || selectedCode === region.kode
  const trend = trendLabel(region.tren_7h)

  return (
    <button
      type="button"
      className={cn(
        'flex min-h-16 w-full items-center gap-3 rounded-card px-3 py-2 text-left',
        'transition-colors duration-150 ease-in-out',
        focusRing,
        active ? 'bg-surface-muted' : 'hover:bg-surface-muted',
      )}
      onMouseEnter={() => hover(region.kode)}
      onMouseLeave={() => hover(null)}
      onClick={() => {
        select(region.kode)
        mapRef.current?.flyTo({
          center: region.pusat,
          zoom: 8,
          padding: getMapPadding(panelOpen),
          duration: reducedMotion ? 0 : 600,
        })
      }}
    >
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-full border-[3px] bg-surface"
        style={{ borderColor: style.dot }}
        aria-hidden
      >
        <span className="font-mono text-sm font-semibold text-ink">{region.skor}</span>
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-base font-semibold text-ink">{region.nama}</span>
        <span className="block truncate text-sm text-ink-2">
          {region.provinsi} · {formatNumber(region.titik_panas_24j)} titik panas
        </span>
      </span>

      <span className="flex shrink-0 flex-col items-end gap-1">
        <Sparkline values={region.tren_7h} width={56} height={20} color={style.dot} />
        <span className="text-xs text-ink-2">{trend}</span>
      </span>
    </button>
  )
}
