import { RiskMarker } from '@/components/common/risk-marker'
import { copy } from '@/copy/id'
import { RISK_CATEGORIES } from '@/lib/risk-category'
import { mapOverlayGestureProps } from '@/lib/stop-map-gesture'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/store/ui'

const MAP_RISK_ORDER = ['sangat_tinggi', 'sedang', 'rendah'] as const

const cardClass =
  'bg-surface/95 rounded-ctl border-line flex w-max shrink-0 flex-col gap-2 border px-4 py-3 shadow-chrome backdrop-blur-sm'

/** Dua kartu strip — jarak dalam kartu sama (px-4 · gap-2 · gap-3). */
export function MapLegend() {
  const panelOpen = useUiStore((s) => s.panelOpen)

  return (
    <div
      data-testid="map-legend"
      className={cn(
        'pointer-events-auto fixed bottom-(--floating-control-offset) z-30',
        'flex w-max max-w-[min(100vw-6.5rem,34rem)] flex-row items-stretch gap-2',
        'ease-out-soft transition-[left] duration-300',
        panelOpen ? 'left-(--map-overlay-inset)' : 'left-(--floating-control-offset)',
      )}
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
              className="text-ink flex items-center gap-1.5 text-xs leading-4 whitespace-nowrap"
            >
              <RiskMarker kategori={category} className="size-2" />
              <span>{RISK_CATEGORIES[category].label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label={copy.legend.densityTitle} className={cardClass}>
        <p className="text-ink-2 text-xs leading-4 font-medium">
          {copy.legend.densityTitle}
        </p>
        <div className="flex flex-col gap-1.5">
          <div
            className="h-1.5 w-full rounded-full"
            style={{
              background:
                'linear-gradient(90deg, var(--color-heat-low), var(--color-heat-mid), var(--color-heat-high))',
            }}
            aria-hidden
          />
          <p className="text-ink-2 flex items-center gap-3 text-xs leading-4 whitespace-nowrap">
            <span>{copy.legend.densityLow}</span>
            <span>{copy.legend.densityMid}</span>
            <span>{copy.legend.densityHigh}</span>
          </p>
        </div>
      </section>
    </div>
  )
}
