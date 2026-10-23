import { useEffect, useRef, useState } from 'react'

import { focusRing } from '@/components/common/focus-ring'
import { RiskMarker } from '@/components/common/risk-marker'
import { Card } from '@/components/ui/card'
import { getCopy } from '@/copy'
import { useMapChrome } from '@/lib/layout'
import { riskCategoryLabel } from '@/lib/risk-category'
import { mapOverlayGestureProps } from '@/lib/stop-map-gesture'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/store/ui'

const MAP_RISK_ORDER = ['sangat_tinggi', 'sedang', 'rendah'] as const

/** Chrome mengambang peta — sama kontrol lokasi: surface + shadow-chrome. */
const legendCardClass = 'bg-surface shrink-0 gap-2 px-3 py-2 shadow-chrome'

/**
 * Legenda risiko peta (sm+ saja).
 * Kerapatan ada di FilterBar (chip di samping filter) — tidak menutup peta.
 */
export function MapLegend() {
  const panelOpen = useUiStore((s) => s.panelOpen)
  const { left, legendAvailWidth: availWidth } = useMapChrome(panelOpen)
  const rowRef = useRef<HTMLDivElement>(null)
  const [overflowX, setOverflowX] = useState(false)

  useEffect(() => {
    const el = rowRef.current
    if (!el) return
    const sync = () => setOverflowX(el.scrollWidth > el.clientWidth + 1)
    sync()
    const ro = new ResizeObserver(sync)
    ro.observe(el)
    return () => ro.disconnect()
  }, [availWidth, panelOpen])

  return (
    <div
      ref={rowRef}
      data-testid="map-legend"
      tabIndex={overflowX ? 0 : undefined}
      className={cn(
        'pointer-events-auto fixed z-30 hidden sm:flex',
        'soft-scroll items-stretch gap-2 overflow-x-auto',
        overflowX && 'soft-fade-x pr-7',
        'ease-out-soft transition-[left,max-width,bottom] duration-300',
        'bottom-(--floating-control-offset)',
        focusRing,
      )}
      style={{ left, maxWidth: availWidth }}
      {...mapOverlayGestureProps}
    >
      <Card
        aria-label={getCopy().legend.riskTitle}
        className={cn(legendCardClass, 'w-max max-w-full')}
      >
        <p className="text-ink-2 text-xs leading-4 font-medium">
          {getCopy().legend.riskTitle}
        </p>
        <ul className="flex flex-nowrap items-center gap-3">
          {MAP_RISK_ORDER.map((category) => (
            <li
              key={category}
              className="text-ink flex items-center gap-2 text-xs leading-4 whitespace-nowrap"
            >
              <RiskMarker kategori={category} className="size-2" />
              <span>{riskCategoryLabel(category)}</span>
            </li>
          ))}
          <li className="text-ink flex items-center gap-2 text-xs leading-4 whitespace-nowrap">
            <RiskMarker kategori="tanpa_titik" className="size-2" />
            <span>{getCopy().legend.noDetectionsTitle}</span>
          </li>
        </ul>
      </Card>
    </div>
  )
}
