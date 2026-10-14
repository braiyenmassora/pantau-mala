import { SessionControl } from '@/auth/access-gate'
import { focusRing } from '@/components/common/focus-ring'
import { copy } from '@/copy/id'
import { mapOverlayGestureProps } from '@/lib/stop-map-gesture'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/store/ui'

/** Strip sumber di pojok kanan bawah peta — semua halaman, gaya sama. */
export function MapSourcesStrip() {
  const panelOpen = useUiStore((s) => s.panelOpen)

  return (
    <div
      className={cn(
        'absolute right-4 bottom-4 z-30 flex max-w-[min(100vw-2rem,20rem)] flex-col items-end gap-1',
        panelOpen && 'hidden sm:flex',
      )}
      {...mapOverlayGestureProps}
    >
      <p className="text-ink-2 bg-surface/90 rounded-ctl border-line flex flex-wrap items-center justify-end gap-x-1 border px-2 py-1 text-xs shadow-sm backdrop-blur-sm">
        <span>{copy.footer.sourcesLabel}</span>
        {copy.footer.sources.map((source, i) => (
          <span key={source.href} className="inline-flex items-center gap-1">
            {i > 0 ? <span aria-hidden>,</span> : null}
            <a
              href={source.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={copy.footer.openInNewTab(source.name)}
              className={cn(
                'text-ink-2 hover:text-brand rounded-ctl font-medium no-underline transition-colors duration-150',
                focusRing,
              )}
            >
              {source.name}
            </a>
          </span>
        ))}
      </p>
      <SessionControl />
    </div>
  )
}
