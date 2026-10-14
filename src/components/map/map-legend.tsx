import { copy } from '@/copy/id'
import { RISK_CATEGORIES, withAlpha } from '@/lib/risk-category'
import { mapOverlayGestureProps } from '@/lib/stop-map-gesture'
import { cn } from '@/lib/utils'

type MapLegendProps = {
  panelOpen: boolean
}

const ICON_BOX = 'relative flex size-10 shrink-0 items-center justify-center'

/** Legend kiri bawah — pin + beat (merah cepat, oranye lebih pelan). */
export function MapLegend({ panelOpen }: MapLegendProps) {
  const mid = RISK_CATEGORIES.sedang.dot
  const high = RISK_CATEGORIES.sangat_tinggi.dot

  return (
    <div
      data-testid="map-legend"
      className={cn(
        'absolute bottom-4 z-30 flex flex-row flex-wrap items-stretch gap-2',
        panelOpen
          ? 'hidden sm:right-[72px] sm:left-[432px] sm:flex'
          : 'left-4 w-max max-w-[calc(100vw-5rem)]',
      )}
      {...mapOverlayGestureProps}
    >
      <div className="rounded-card border-line bg-surface flex items-center gap-2 border px-3 py-2 shadow-sm">
        <span className={ICON_BOX} aria-hidden>
          <span
            className="animate-halo-high pointer-events-none absolute top-1/2 left-1/2 size-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
            style={{ borderColor: withAlpha(high, 0.55) }}
          />
          <span className="relative size-3 rounded-full" style={{ backgroundColor: high }} />
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-ink text-sm font-semibold">{copy.legend.haloTitle}</span>
          <span className="text-ink-2 text-xs leading-4">{copy.legend.haloHint}</span>
        </span>
      </div>

      <div className="rounded-card border-line bg-surface flex items-center gap-2 border px-3 py-2 shadow-sm">
        <span className="flex size-10 shrink-0 items-center justify-center gap-1.5" aria-hidden>
          <span className="size-3 rounded-full" style={{ backgroundColor: mid }} />
          <span className="size-3 rounded-full" style={{ backgroundColor: high }} />
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-ink text-sm font-semibold">{copy.legend.pinTitle}</span>
          <span className="text-ink-2 text-xs leading-4">{copy.legend.pinHint}</span>
        </span>
      </div>
    </div>
  )
}
