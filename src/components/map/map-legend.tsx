import { copy } from '@/copy/id'
import { RISK_CATEGORIES, withAlpha } from '@/lib/risk-category'
import { mapOverlayGestureProps } from '@/lib/stop-map-gesture'
import { cn } from '@/lib/utils'

type MapLegendProps = {
  panelOpen: boolean
}

/** Shared left column width so score pin and halo align with captions. */
const ICON_COL = 'w-12 shrink-0'

export function MapLegend({ panelOpen }: MapLegendProps) {
  const high = RISK_CATEGORIES.sangat_tinggi.dot
  const mid = RISK_CATEGORIES.sedang.dot

  return (
    <div
      className={cn(
        'absolute bottom-4 z-30 flex max-w-60 flex-col gap-2 rounded-card border border-line bg-surface p-3 shadow-sm',
        'transition-[left] duration-300 ease-[var(--ease-out-soft)]',
        panelOpen ? 'left-[432px]' : 'left-4',
      )}
      {...mapOverlayGestureProps}
    >
      <div className="flex items-center gap-2">
        <span className={cn(ICON_COL, 'flex justify-start')}>
          <span
            className="flex h-5 items-center gap-1 rounded-full border border-line bg-surface shadow-map"
            style={{ paddingLeft: 8, paddingRight: 10 }}
          >
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: high }}
              aria-hidden
            />
            <span className="font-mono text-xs font-semibold">82</span>
          </span>
        </span>
        <span className="text-xs text-ink">{copy.legend.score}</span>
      </div>

      <div className="flex items-start gap-2">
        <span className={cn(ICON_COL, 'flex h-5 items-center justify-start')} aria-hidden>
          <span className="relative size-3.5">
            <span
              className="absolute top-0 left-0 size-3.5 rounded-full border"
              style={{
                backgroundColor: withAlpha(high, 0.1),
                borderColor: withAlpha(high, 0.24),
              }}
            />
            <span
              className="absolute top-0 left-[-4px] size-3.5 rounded-full border"
              style={{
                backgroundColor: withAlpha(mid, 0.1),
                borderColor: withAlpha(mid, 0.24),
              }}
            />
          </span>
        </span>
        <span className="text-xs text-ink-2">{copy.legend.halo}</span>
      </div>
    </div>
  )
}
