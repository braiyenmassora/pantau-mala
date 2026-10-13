import { Wind } from 'lucide-react'

import { RiskMarker } from "@/components/common/risk-marker"
import { copy } from "@/copy/id"
import { RISK_CATEGORIES } from "@/lib/risk-category"
import { mapOverlayGestureProps } from "@/lib/stop-map-gesture"
import { cn } from "@/lib/utils"
import { useMapStore } from "@/store/map"

type MapLegendProps = {
  panelOpen: boolean
}

const ICON_BOX = "flex size-9 shrink-0 items-center justify-center"

export function MapLegend({ panelOpen }: MapLegendProps) {
  const showWind = useMapStore((s) => s.showWind)
  const mid = RISK_CATEGORIES.sedang.dot
  const high = RISK_CATEGORIES.sangat_tinggi.dot

  return (
    <div
      data-testid="map-legend"
      className={cn(
        "absolute bottom-4 z-30 flex flex-row flex-wrap items-stretch gap-2",
        "transition-[left,right] duration-300 ease-[var(--ease-out-soft)]",
        panelOpen
          ? "hidden sm:right-[72px] sm:left-[432px] sm:flex"
          : "left-4 w-max max-w-[calc(100vw-5rem)]",
      )}
      {...mapOverlayGestureProps}
    >
      <div className="rounded-card border-line bg-surface-muted flex items-center gap-2 border px-3 py-2 shadow-sm">
        <span className={`${ICON_BOX} gap-1`} aria-hidden>
          <RiskMarker kategori="sedang" active className="size-5 [&_svg]:size-3" />
          <RiskMarker kategori="sangat_tinggi" active className="size-5 [&_svg]:size-3" />
        </span>
        <span className="flex min-w-0 flex-col gap-1">
          <span className="text-ink text-xs font-semibold">{copy.legend.colorTitle}</span>
          <span className="text-ink-2 text-xs leading-4">{copy.legend.colorHint}</span>
        </span>
      </div>

      <div className="rounded-card border-line bg-surface-muted flex items-center gap-2 border px-3 py-2 shadow-sm">
        <span className={`${ICON_BOX}`} aria-hidden>
          <span className="border-line bg-surface shadow-map inline-flex items-center gap-1 rounded-full border px-2 py-1 text-risk-mid">
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-3.5 shrink-0"
              aria-hidden="true"
            >
              <circle cx="10" cy="10" r="2" fill="currentColor" stroke="none" />
              <path d="M13.5 6.5a5 5 0 0 1 0 7m-7 0a5 5 0 0 1 0-7" />
            </svg>
            <span className="font-mono text-xs font-semibold text-ink">M</span>
          </span>
        </span>
        <span className="flex min-w-0 flex-col gap-1">
          <span className="text-ink text-xs font-semibold">{copy.legend.seismicTitle}</span>
          <span className="text-ink-2 text-xs leading-4">{copy.legend.seismicHint}</span>
        </span>
      </div>

      <div className="rounded-card border-line bg-surface-muted flex items-center gap-2 border px-3 py-2 shadow-sm">
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

      {showWind && (
        <div className="rounded-card border-line bg-surface-muted flex items-center gap-2 border px-3 py-2 shadow-sm">
          <span className={`${ICON_BOX}`} aria-hidden>
            <Wind className="text-ink-2 size-4 shrink-0 animate-wind-drift" strokeWidth={2} />
          </span>
          <span className="flex min-w-0 flex-col gap-1">
            <span className="text-ink text-xs font-semibold">{copy.legend.windTitle}</span>
            <span className="text-ink-2 text-xs leading-4">{copy.legend.windHint}</span>
          </span>
        </div>
      )}
    </div>
  )
}
