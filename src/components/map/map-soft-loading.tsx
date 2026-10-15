import { Loader2 } from 'lucide-react'
import type { CSSProperties } from 'react'

import { copy } from '@/copy/id'
import { getMapPadding } from '@/lib/indonesia-view'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/store/ui'

/** Satu loader peta — spinner saja, tanpa kartu chrome. */
export function MapSoftLoading({ className }: { className?: string }) {
  const panelOpen = useUiStore((s) => s.panelOpen)
  const pad = getMapPadding(panelOpen)

  return (
    <div
      className={cn('bg-map-bg relative size-full', className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={copy.empty.mapLoading}
      data-testid="map-soft-loading"
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
        <div className="flex flex-col items-center gap-2">
          <Loader2
            className="text-brand size-8 shrink-0 animate-spin"
            strokeWidth={2}
            aria-hidden
          />
          <span className="text-ink-2 text-xs leading-4">{copy.empty.mapLoading}</span>
        </div>
      </div>
    </div>
  )
}
