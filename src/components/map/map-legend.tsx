import { Radio } from 'lucide-react'
import type { ReactNode } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { copy } from '@/copy/id'
import { HOTSPOT_HEX, RISK_CATEGORIES } from '@/lib/risk-category'
import { mapOverlayGestureProps } from '@/lib/stop-map-gesture'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/store/ui'

function RiskPinSwatch({ color }: { color: string }) {
  return (
    <span
      className="rounded-ctl size-3 shrink-0"
      style={{ backgroundColor: color }}
      aria-hidden
    />
  )
}

function LegendItem({
  symbol,
  title,
  hint,
}: {
  symbol: ReactNode
  title: string
  hint: string
}) {
  return (
    <Card className="bg-surface/95 pointer-events-auto shadow-sm backdrop-blur-sm">
      <CardContent className="flex items-center gap-2 px-3 py-2">
        <span className="shrink-0" aria-hidden>
          {symbol}
        </span>
        <span className="min-w-0">
          <span className="text-ink block text-xs leading-4 font-semibold">{title}</span>
          <span className="text-ink-2 block text-xs leading-4">{hint}</span>
        </span>
      </CardContent>
    </Card>
  )
}

// ponytail: legend = kartu terpisah, inset sama FilterBar, kanan longgar untuk MapControls.
export function MapLegend() {
  const panelOpen = useUiStore((s) => s.panelOpen)
  const mid = RISK_CATEGORIES.sedang.dot
  const high = RISK_CATEGORIES.sangat_tinggi.dot

  return (
    <div
      data-testid="map-legend"
      className={cn(
        'pointer-events-none fixed bottom-(--floating-control-offset) z-30 flex flex-wrap items-end gap-2',
        'ease-out-soft transition-[left] duration-300',
        panelOpen
          ? 'right-(--map-controls-clearance) left-(--map-overlay-inset) max-sm:hidden'
          : 'right-(--map-controls-clearance) left-(--floating-control-offset)',
      )}
      {...mapOverlayGestureProps}
    >
      <LegendItem
        symbol={
          <span className="flex items-center gap-1">
            <RiskPinSwatch color={mid} />
            <RiskPinSwatch color={high} />
          </span>
        }
        title={copy.legend.riskTitle}
        hint={copy.legend.riskHint}
      />
      <LegendItem
        symbol={
          <span
            className="block size-2 rounded-full"
            style={{ backgroundColor: HOTSPOT_HEX }}
          />
        }
        title={copy.legend.detectionTitle}
        hint={copy.legend.detectionHint}
      />
      <LegendItem
        symbol={
          <span className="border-line bg-surface text-risk-mid flex size-5 items-center justify-center rounded-full border">
            <Radio className="size-3" strokeWidth={2.25} />
          </span>
        }
        title={copy.legend.quakeTitle}
        hint={copy.legend.quakeHint}
      />
      <LegendItem
        symbol={
          <span className="from-risk-mid-tint via-risk-mid to-risk-high h-2 w-8 rounded-full bg-gradient-to-r" />
        }
        title={copy.legend.densityTitle}
        hint={copy.legend.densityHint}
      />
    </div>
  )
}
