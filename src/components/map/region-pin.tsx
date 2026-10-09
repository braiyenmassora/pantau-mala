import { focusRing } from '@/components/common/focus-ring'
import { MapMarker, MarkerContent, useMap } from '@/components/ui/map'
import type { Region, RiskCategory } from '@/data/types'
import { getMapPadding } from '@/lib/indonesia-view'
import { usePrefersReducedMotion } from '@/lib/prefers-reduced-motion'
import { RISK_CATEGORIES, withAlpha } from '@/lib/risk-category'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

type RegionPinProps = {
  region: Region
}

const ACTIVE_PIN: Record<RiskCategory, string> = {
  sangat_tinggi: 'border-[1.5px] border-risk-high bg-risk-high-tint text-risk-high-text',
  sedang: 'border-[1.5px] border-risk-mid bg-risk-mid-tint text-risk-mid-text',
  rendah: 'border-[1.5px] border-risk-low bg-risk-low-tint text-risk-low-text',
}

export function RegionPin({ region }: RegionPinProps) {
  const { map } = useMap()
  const reducedMotion = usePrefersReducedMotion()
  const selectedCode = useMapStore((s) => s.selectedCode)
  const hoveredCode = useMapStore((s) => s.hoveredCode)
  const select = useMapStore((s) => s.select)
  const hover = useMapStore((s) => s.hover)
  const panelOpen = useUiStore((s) => s.panelOpen)

  const style = RISK_CATEGORIES[region.kategori]
  const active = selectedCode === region.kode || hoveredCode === region.kode
  const showHalo = region.kategori !== 'rendah'
  const haloSize = 48 + 3 * region.titik_panas_24j
  const pulseClass =
    region.kategori === 'sangat_tinggi' ? 'animate-halo-high' : 'animate-halo-mid'
  const label = `${region.nama}, skor ${region.skor}, risiko ${style.label}`

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
        {showHalo && (
          <>
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
          </>
        )}

        <button
          type="button"
          className={cn(
            'relative flex h-7 items-center gap-2 rounded-full border border-line bg-surface text-ink shadow-map',
            'origin-center transition-[transform,box-shadow,background-color,border-color,color] duration-150 ease-in-out',
            focusRing,
            active && cn('scale-110 shadow-[0_2px_8px_rgba(20,38,27,0.24)]', ACTIVE_PIN[region.kategori]),
          )}
          style={{ paddingLeft: 8, paddingRight: 10 }}
          title={region.nama}
          aria-label={label}
          onClick={(e) => {
            e.stopPropagation()
            select(region.kode)
            map?.flyTo({
              center: region.pusat,
              zoom: 8,
              padding: getMapPadding(panelOpen),
              duration: reducedMotion ? 0 : 600,
            })
          }}
        >
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: style.dot }}
            aria-hidden
          />
          <span className="font-mono text-sm font-semibold">{region.skor}</span>
          {active && (
            <span className="max-w-[180px] truncate text-sm font-medium" title={region.nama}>
              {region.nama}
            </span>
          )}
        </button>
      </MarkerContent>
    </MapMarker>
  )
}
