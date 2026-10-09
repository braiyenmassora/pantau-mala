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
  const low = RISK_CATEGORIES.rendah.dot

  return (
    <div
      data-testid="map-legend"
      className={cn(
        'absolute bottom-4 z-30 flex flex-row flex-wrap items-stretch gap-2',
        'transition-[left,right] duration-300 ease-[var(--ease-out-soft)]',
        panelOpen ? 'left-[432px] right-[72px]' : 'left-4 w-max max-w-[calc(100vw-5rem)]',
      )}
      {...mapOverlayGestureProps}
    >
      <div className="flex items-center gap-2 rounded-card border border-line bg-surface px-3 py-2 shadow-sm">
        <span className={ICON_BOX} aria-hidden>
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: high }}
          />
        </span>
        <span className="flex flex-col gap-1">
          <span className="font-mono text-xs font-semibold text-ink">
            {copy.legend.scoreTitle}
          </span>
          <span className="text-xs text-ink-2">{copy.legend.scoreHint}</span>
        </span>
      </div>

      <div className="flex items-center gap-2 rounded-card border border-line bg-surface px-3 py-2 shadow-sm">
        <span className={`${ICON_BOX} gap-1`} aria-hidden>
          {[low, mid, high].map((dot) => (
            <span
              key={dot}
              className="size-2.5 rounded-full border"
              style={{
                backgroundColor: withAlpha(dot, 0.1),
                borderColor: withAlpha(dot, 0.24),
              }}
            />
          ))}
        </span>
        <span className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-ink">
            {copy.legend.haloTitle}
          </span>
          <span className="text-xs text-ink-2">{copy.legend.haloHint}</span>
        </span>
      </div>
    </div>
  )
}
