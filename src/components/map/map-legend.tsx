import { Flame } from 'lucide-react'

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
      data-testid="map-legend"
      className={cn(
        'absolute bottom-4 z-30 flex flex-row flex-wrap items-stretch gap-2',
        'transition-[left,right] duration-300 ease-[var(--ease-out-soft)]',
        panelOpen ? 'right-[72px] left-[432px]' : 'left-4 w-max max-w-[calc(100vw-5rem)]',
      )}
      {...mapOverlayGestureProps}
    >
      <div className="rounded-card border-line bg-surface-muted flex items-center gap-2 border px-3 py-2 shadow-sm">
        <span className={`${ICON_BOX} gap-1`} aria-hidden>
          <Flame className="fill-risk-mid stroke-risk-mid size-3.5" strokeWidth={2} />
          <Flame className="fill-risk-high stroke-risk-high size-3.5" strokeWidth={2} />
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-ink text-xs font-semibold">{copy.legend.colorTitle}</span>
          <span className="text-ink-2 text-xs leading-4">{copy.legend.colorHint}</span>
        </span>
      </div>

      <div className="rounded-card border-line bg-surface-muted flex items-center gap-2 border px-3 py-2 shadow-sm">
        <span className={`${ICON_BOX} gap-1`} aria-hidden>
          {[mid, high].map((dot) => (
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
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-ink text-xs font-semibold">{copy.legend.haloTitle}</span>
          <span className="text-ink-2 text-xs leading-4">{copy.legend.haloHint}</span>
        </span>
      </div>
    </div>
  )
}
