import { useEffect, useRef, useState } from 'react'

import { RiskMarker } from '@/components/common/risk-marker'
import { Card } from '@/components/ui/card'
import { copy } from '@/copy/id'
import { useMapChrome } from '@/lib/layout'
import { RISK_CATEGORIES } from '@/lib/risk-category'
import { mapOverlayGestureProps } from '@/lib/stop-map-gesture'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/store/ui'

const MAP_RISK_ORDER = ['sangat_tinggi', 'sedang', 'rendah'] as const

/** Strip compact: radius/border Card, pad & isi seperti sebelumnya (tanpa scroll). */
const legendCardClass =
  'bg-surface/95 shrink-0 gap-1.5 px-3 py-2 shadow-chrome backdrop-blur-sm'

/** Dua kartu strip: risiko (+ abu tanpa titik) dan kerapatan — lebar & tinggi sama. */
export function MapLegend() {
  const panelOpen = useUiStore((s) => s.panelOpen)
  const { left, availWidth } = useMapChrome(panelOpen)
  const rowRef = useRef<HTMLDivElement>(null)
  const riskRef = useRef<HTMLDivElement>(null)
  const [overflowX, setOverflowX] = useState(false)
  const [riskWidth, setRiskWidth] = useState<number | null>(null)

  useEffect(() => {
    const el = rowRef.current
    if (!el) return
    const sync = () => setOverflowX(el.scrollWidth > el.clientWidth + 1)
    sync()
    const ro = new ResizeObserver(sync)
    ro.observe(el)
    return () => ro.disconnect()
  }, [availWidth, panelOpen, riskWidth])

  useEffect(() => {
    const el = riskRef.current
    if (!el) return
    const sync = () => setRiskWidth(el.offsetWidth)
    sync()
    const ro = new ResizeObserver(sync)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div
      ref={rowRef}
      data-testid="map-legend"
      className={cn(
        'pointer-events-auto fixed bottom-(--floating-control-offset) z-30',
        'soft-scroll flex flex-row items-stretch gap-2 overflow-x-auto',
        overflowX && 'soft-fade-x pr-7',
        'ease-out-soft transition-[left,max-width] duration-300',
        panelOpen && 'max-sm:hidden',
      )}
      style={{ left, maxWidth: availWidth }}
      {...mapOverlayGestureProps}
    >
      <Card
        ref={riskRef}
        aria-label={copy.legend.riskTitle}
        className={cn(legendCardClass, 'w-max')}
      >
        <p className="text-ink-2 text-xs leading-4 font-medium">
          {copy.legend.riskTitle}
        </p>
        <ul className="flex flex-nowrap items-center gap-3">
          {MAP_RISK_ORDER.map((category) => (
            <li
              key={category}
              className="text-ink flex items-center gap-2 text-xs leading-4 whitespace-nowrap"
            >
              <RiskMarker kategori={category} className="size-2" />
              <span>{RISK_CATEGORIES[category].label}</span>
            </li>
          ))}
          <li className="text-ink flex items-center gap-2 text-xs leading-4 whitespace-nowrap">
            <RiskMarker kategori="tanpa_titik" className="size-2" />
            <span>{copy.legend.noDetectionsTitle}</span>
          </li>
        </ul>
      </Card>

      <Card
        aria-label={`${copy.legend.densityTitle}: ${copy.legend.densityLow}, ${copy.legend.densityMid}, ${copy.legend.densityHigh}`}
        className={cn(legendCardClass, 'box-border min-w-0')}
        style={riskWidth != null ? { width: riskWidth } : undefined}
      >
        <p className="text-ink-2 text-xs leading-4 font-medium">
          {copy.legend.densityTitle}
        </p>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-center gap-1.5">
          <div
            className="h-1.5 w-full rounded-full"
            style={{
              background:
                'linear-gradient(90deg, var(--color-heat-low), var(--color-heat-mid), var(--color-heat-high))',
            }}
            aria-hidden
          />
          <p
            className="text-ink-2 flex items-center justify-between gap-2 text-xs leading-4 whitespace-nowrap"
            aria-hidden
          >
            <span>{copy.legend.densityLow}</span>
            <span>{copy.legend.densityMid}</span>
            <span>{copy.legend.densityHigh}</span>
          </p>
        </div>
      </Card>
    </div>
  )
}
