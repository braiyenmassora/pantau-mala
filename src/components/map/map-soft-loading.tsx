import { useEffect, useState } from 'react'
import { copy } from '@/copy/id'
import { getMapPadding } from '@/lib/indonesia-view'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/store/ui'

/** Soft map placeholder; caption only after a short delay so fast loads don't flash. */
export function MapSoftLoading({ className }: { className?: string }) {
  const panelOpen = useUiStore((s) => s.panelOpen)
  const pad = getMapPadding(panelOpen)
  const [showHint, setShowHint] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => setShowHint(true), 400)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      className={cn('relative size-full bg-map-bg', className)}
      role="status"
      aria-live="polite"
    >
      {showHint && (
        <div
          className="pointer-events-none absolute flex items-center justify-center"
          style={{
            top: pad.top,
            right: pad.right,
            bottom: pad.bottom,
            left: pad.left,
          }}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-1" aria-hidden>
              <span className="size-1.5 animate-pulse rounded-full bg-ink-3" />
              <span className="size-1.5 animate-pulse rounded-full bg-ink-3 [animation-delay:150ms]" />
              <span className="size-1.5 animate-pulse rounded-full bg-ink-3 [animation-delay:300ms]" />
            </div>
            <span className="text-xs text-ink-2">{copy.empty.mapLoading}</span>
          </div>
        </div>
      )}
    </div>
  )
}
