import type { CSSProperties } from 'react'
import { copy } from '@/copy/id'
import { getMapPadding } from '@/lib/indonesia-view'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/store/ui'

/** Soft map placeholder while regions (or map) still loading. */
export function MapSoftLoading({ className }: { className?: string }) {
  const panelOpen = useUiStore((s) => s.panelOpen)
  const pad = getMapPadding(panelOpen)

  return (
    <div
      className={cn('bg-map-bg relative size-full', className)}
      role="status"
      aria-live="polite"
      aria-label={copy.empty.mapLoading}
    >
      <div
        className="pointer-events-none absolute flex items-center justify-center"
        style={
          {
            top: pad.top,
            right: pad.right,
            bottom: pad.bottom,
            left: pad.left,
          } as CSSProperties
        }
      >
        <span className="text-ink-2 text-xs">{copy.empty.mapLoading}</span>
      </div>
    </div>
  )
}
