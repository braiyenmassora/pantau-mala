import { copy } from '@/copy/id'
import { RISK_CATEGORIES } from '@/lib/risk-category'
import { mapOverlayGestureProps } from '@/lib/stop-map-gesture'
import { mapChromeClass } from '@/lib/ui-chrome'
import { cn } from '@/lib/utils'

type MapLegendProps = {
  panelOpen: boolean
}

const ICON_BOX = 'flex size-9 shrink-0 items-center justify-center'

export function MapLegend({ panelOpen }: MapLegendProps) {
  // Hex sama dengan HotspotHeatmapLayer (sedang → sangat tinggi).
  const mid = RISK_CATEGORIES.sedang.dot
  const high = RISK_CATEGORIES.sangat_tinggi.dot

  return (
    <div
      data-testid="map-legend"
      className={cn(
        'absolute bottom-4 z-30 flex flex-row flex-wrap items-stretch gap-2',
        'transition-[left,right] duration-300 ease-[var(--ease-out-soft)]',
        panelOpen ? 'right-[72px] left-[432px]' : 'left-4 w-max max-w-[calc(100vw-5rem)]',
      )}
      {...mapOverlayGestureProps}
    >
      <div className={cn(mapChromeClass, 'flex items-center gap-2')}>
        <span className={`${ICON_BOX} gap-1`} aria-hidden>
          <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: mid }} />
          <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: high }} />
        </span>
        <span className="flex min-w-0 flex-col gap-1">
          <span className="text-ink text-xs font-semibold">{copy.legend.colorTitle}</span>
          <span className="text-ink-2 text-xs leading-4">{copy.legend.colorHint}</span>
        </span>
      </div>

      <div className={cn(mapChromeClass, 'flex items-center gap-2')}>
        <span className={`${ICON_BOX}`} aria-hidden>
          <span
            className="h-3 w-8 rounded-full"
            style={{ background: `linear-gradient(90deg, ${mid}, ${high})` }}
          />
        </span>
        <span className="flex min-w-0 flex-col gap-1">
          <span className="text-ink text-xs font-semibold">{copy.legend.haloTitle}</span>
          <span className="text-ink-2 text-xs leading-4">{copy.legend.haloHint}</span>
        </span>
      </div>
    </div>
  )
}
