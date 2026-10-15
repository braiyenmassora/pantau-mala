import { Radio } from 'lucide-react'

import { copy } from '@/copy/id'
import { RISK_CATEGORIES } from '@/lib/risk-category'
import { mapOverlayGestureProps } from '@/lib/stop-map-gesture'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/store/ui'

function RiskPinSwatch({ color }: { color: string }) {
  return (
    <span
      className="marker--pulse-static border-surface relative size-2.5 shrink-0 rounded-full border-2"
      style={
        {
          backgroundColor: color,
          '--risk-color': color,
        } as React.CSSProperties
      }
      aria-hidden
    />
  )
}

// ponytail: satu strip horizontal kiri bawah — token tipografi/warna.
export function MapLegend() {
  const panelOpen = useUiStore((s) => s.panelOpen)
  const mid = RISK_CATEGORIES.sedang.dot
  const high = RISK_CATEGORIES.sangat_tinggi.dot

  return (
    <div
      data-testid="map-legend"
      className={cn(
        'pointer-events-none fixed bottom-4 z-30',
        'ease-out-soft transition-[left] duration-300',
        panelOpen ? 'left-[416px] max-sm:hidden' : 'left-4',
      )}
      {...mapOverlayGestureProps}
    >
      <div className="rounded-card border-line bg-surface/95 pointer-events-auto flex max-w-[min(720px,calc(100vw-6rem))] items-center gap-3 overflow-x-auto border px-3 py-2 shadow-sm backdrop-blur-sm">
        <span className="flex shrink-0 items-center gap-2 whitespace-nowrap">
          <span className="flex items-center gap-1" aria-hidden>
            <RiskPinSwatch color={mid} />
            <RiskPinSwatch color={high} />
          </span>
          <span className="text-ink text-xs font-semibold">{copy.legend.riskTitle}</span>
          <span className="text-ink-2 text-xs">{copy.legend.riskHint}</span>
        </span>

        <span className="bg-line h-3 w-px shrink-0" aria-hidden />

        <span className="flex shrink-0 items-center gap-2 whitespace-nowrap">
          <Radio
            className="text-risk-mid size-3.5 shrink-0"
            strokeWidth={2}
            aria-hidden
          />
          <span className="text-ink text-xs font-semibold">{copy.legend.quakeTitle}</span>
          <span className="text-ink-2 text-xs">{copy.legend.quakeHint}</span>
        </span>

        <span className="bg-line h-3 w-px shrink-0" aria-hidden />

        <span className="flex shrink-0 items-center gap-2 whitespace-nowrap">
          <span
            className="from-risk-mid-tint via-risk-mid to-risk-high h-2 w-8 shrink-0 rounded-full bg-gradient-to-r"
            aria-hidden
          />
          <span className="text-ink text-xs font-semibold">
            {copy.legend.densityTitle}
          </span>
          <span className="text-ink-2 text-xs">{copy.legend.densityHint}</span>
        </span>
      </div>
    </div>
  )
}
