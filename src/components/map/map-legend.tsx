import { copy } from '@/copy/id'
import { RISK_CATEGORIES, withAlpha } from '@/lib/risk-category'
import { mapOverlayGestureProps } from '@/lib/stop-map-gesture'
import { cn } from '@/lib/utils'

type MapLegendProps = {
  panelOpen: boolean
}

const ICON_BOX = 'flex size-9 shrink-0 items-center justify-center'

export function MapLegend({ panelOpen }: MapLegendProps) {
  const high = RISK_CATEGORIES.sangat_tinggi.dot
  const mid = RISK_CATEGORIES.sedang.dot

  return (
    <div
      className={cn(
        'absolute bottom-4 z-30 flex flex-row items-stretch gap-2',
        'transition-[left] duration-300 ease-[var(--ease-out-soft)]',
        panelOpen ? 'left-[432px] max-[1099px]:flex-wrap' : 'left-4',
      )}
      {...mapOverlayGestureProps}
    >
      <div className="flex items-center gap-2 rounded-card border border-line bg-surface px-3 py-2 shadow-sm">
        <span className={ICON_BOX} aria-hidden>
          <span
            className="flex h-5 items-center gap-1 rounded-full border border-line bg-surface shadow-map"
            style={{ paddingLeft: 6, paddingRight: 6 }}
          >
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: high }}
            />
            <span className="font-mono text-xs font-semibold">82</span>
          </span>
        </span>
        <span className="text-xs text-ink">{copy.legend.score}</span>
      </div>

      <div className="flex items-center gap-2 rounded-card border border-line bg-surface px-3 py-2 shadow-sm">
        <span className={ICON_BOX} aria-hidden>
          <span className="relative size-4">
            <span
              className="absolute top-0 left-0 size-4 rounded-full border"
              style={{
                backgroundColor: withAlpha(high, 0.1),
                borderColor: withAlpha(high, 0.24),
              }}
            />
            <span
              className="absolute top-0 left-[-6px] size-4 rounded-full border"
              style={{
                backgroundColor: withAlpha(mid, 0.1),
                borderColor: withAlpha(mid, 0.24),
              }}
            />
          </span>
        </span>
        <span className="max-w-[200px] text-xs text-ink-2">{copy.legend.halo}</span>
      </div>
    </div>
  )
}
