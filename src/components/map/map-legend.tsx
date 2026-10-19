import { ListFilter, Radio, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { focusRing } from '@/components/common/focus-ring'
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
          <span data-legend-hint className="text-ink-2 block text-xs leading-4">
            {hint}
          </span>
        </span>
      </CardContent>
    </Card>
  )
}

// ponytail: legend = kartu terpisah, inset sama FilterBar, kanan longgar untuk MapControls.
export function MapLegend() {
  const panelOpen = useUiStore((s) => s.panelOpen)
  const [mobileOpen, setMobileOpen] = useState(false)
  const mid = RISK_CATEGORIES.sedang.dot
  const high = RISK_CATEGORIES.sangat_tinggi.dot

  return (
    <div
      data-testid="map-legend"
      className={cn(
        'map-legend pointer-events-none fixed bottom-(--floating-control-offset) z-30 flex flex-wrap items-end gap-2',
        'ease-out-soft transition-[left] duration-300',
        panelOpen
          ? 'mobile-map-legend-panel-open right-(--map-controls-clearance) left-(--map-overlay-inset) max-sm:hidden'
          : 'right-(--map-controls-clearance) left-(--floating-control-offset)',
      )}
      {...mapOverlayGestureProps}
    >
      <button
        type="button"
        className={cn(
          'mobile-legend-trigger border-line bg-surface text-ink pointer-events-auto hidden h-11 items-center gap-2 rounded-full border px-3 text-sm font-medium shadow-sm backdrop-blur-sm',
          focusRing,
        )}
        aria-expanded={mobileOpen}
        aria-controls="mobile-map-legend-items"
        aria-label={mobileOpen ? copy.legend.hideMenu : copy.legend.showMenu}
        onClick={() => setMobileOpen((open) => !open)}
      >
        {mobileOpen ? (
          <X className="size-4" strokeWidth={1.75} aria-hidden />
        ) : (
          <ListFilter className="size-4" strokeWidth={1.75} aria-hidden />
        )}
        {copy.legend.menu}
      </button>
      <div
        id="mobile-map-legend-items"
        className={cn('map-legend-items contents', mobileOpen && 'mobile-legend-open')}
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
    </div>
  )
}
