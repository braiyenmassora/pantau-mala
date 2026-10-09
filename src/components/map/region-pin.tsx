import { focusRing } from '@/components/common/focus-ring'
import { MapMarker, MarkerContent, useMap } from '@/components/ui/map'
import type { Region } from '@/data/types'
import { getMapPadding } from '@/lib/indonesia-view'
import { usePrefersReducedMotion } from '@/lib/prefers-reduced-motion'
import { RISK_CATEGORIES, withAlpha } from '@/lib/risk-category'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

type RegionPinProps = {
  region: Region
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
            'relative flex h-7 items-center gap-2 rounded-full border border-line bg-surface px-2 shadow-map',
            'origin-center transition-transform duration-150 ease-in-out',
            focusRing,
            active && 'scale-110 border-ink bg-ink text-surface',
          )}
          aria-label={`${region.nama}, skor ${region.skor}, risiko ${style.label}`}
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
            className={cn(
              'size-2 shrink-0 rounded-full',
              active && 'ring-[1.5px] ring-surface',
            )}
            style={{ backgroundColor: style.dot }}
          />
          <span className="font-mono text-sm font-semibold">{region.skor}</span>
          {active && (
            <span className="max-w-40 truncate text-sm font-semibold">{region.nama}</span>
          )}
        </button>
      </MarkerContent>
    </MapMarker>
  )
}
