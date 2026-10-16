import { RiskMarker } from '@/components/common/risk-marker'
import { copy } from '@/copy/id'
import { chromeAvailWidth, chromeLeft } from '@/lib/layout'
import { RISK_CATEGORIES } from '@/lib/risk-category'
import { mapOverlayGestureProps } from '@/lib/stop-map-gesture'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/store/ui'

const MAP_RISK_ORDER = ['sangat_tinggi', 'sedang', 'rendah'] as const

const cardClass =
  'bg-surface/95 rounded-card border-line flex w-max shrink-0 flex-col gap-2 border px-4 py-3 shadow-chrome backdrop-blur-sm'

/** Dua kartu strip — inset chromeLeft; max-width sisakan MapControls. */
export function MapLegend() {
  const panelOpen = useUiStore((s) => s.panelOpen)
  const left = chromeLeft(panelOpen)

  return (
    <div
      data-testid="map-legend"
      className={cn(
        'pointer-events-auto fixed bottom-(--floating-control-offset) z-30',
        'soft-scroll soft-fade-x flex flex-row items-stretch gap-2 overflow-x-auto',
        'ease-out-soft transition-[left,max-width] duration-300',
        panelOpen && 'max-sm:hidden',
      )}
      style={{ left, maxWidth: chromeAvailWidth(panelOpen) }}
      {...mapOverlayGestureProps}
    >
      <section
        aria-label={copy.legend.riskTitle}
        title={copy.legend.riskNote}
        className={cardClass}
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
        </ul>
      </section>

      <section
        aria-label={`${copy.legend.densityTitle}: ${copy.legend.densityLow}, ${copy.legend.densityMid}, ${copy.legend.densityHigh}`}
        className={cardClass}
      >
        <p className="text-ink-2 text-xs leading-4 font-medium">
          {copy.legend.densityTitle}
        </p>
        <div className="flex flex-col gap-2">
          <div
            className="h-1.5 w-full rounded-full"
            style={{
              background:
                'linear-gradient(90deg, var(--color-heat-low), var(--color-heat-mid), var(--color-heat-high))',
            }}
            aria-hidden
          />
          <p
            className="text-ink-2 flex items-center gap-3 text-xs leading-4 whitespace-nowrap"
            aria-hidden
          >
            <span>{copy.legend.densityLow}</span>
            <span>{copy.legend.densityMid}</span>
            <span>{copy.legend.densityHigh}</span>
          </p>
        </div>
      </section>
    </div>
  )
}
