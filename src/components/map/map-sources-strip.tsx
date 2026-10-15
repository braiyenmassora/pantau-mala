import { useEffect, useState } from 'react'

import { SessionControl } from '@/auth/access-gate'
import { focusRing } from '@/components/common/focus-ring'
import { copy } from '@/copy/id'
import { useMeta } from '@/data/queries'
import { formatRelativeAge } from '@/lib/format'
import { mapOverlayGestureProps } from '@/lib/stop-map-gesture'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/store/ui'

/** Strip sumber di pojok kanan bawah peta — umur tarik per sumber. */
export function MapSourcesStrip() {
  const panelOpen = useUiStore((s) => s.panelOpen)
  const { data } = useMeta()
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    const t = window.setInterval(() => setNowMs(Date.now()), 60_000)
    return () => window.clearInterval(t)
  }, [])

  return (
    <div
      className={cn(
        'absolute right-4 bottom-4 z-30 flex max-w-[min(100vw-2rem,22rem)] flex-col items-end gap-1',
        panelOpen && 'hidden sm:flex',
      )}
      {...mapOverlayGestureProps}
    >
      <p className="text-ink-2 bg-surface/90 rounded-ctl border-line flex flex-wrap items-center justify-end gap-x-1 border px-2 py-1 text-xs shadow-sm backdrop-blur-sm">
        <span>{copy.footer.sourcesLabel}</span>
        {copy.footer.sources.map((source, i) => {
          const iso = data?.pulled_at[source.id] ?? null
          const age = iso ? formatRelativeAge(iso, nowMs) : null
          return (
            <span key={source.href} className="inline-flex items-center gap-1">
              {i > 0 ? <span aria-hidden>,</span> : null}
              <a
                href={source.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={
                  age
                    ? `${source.name}, ${age}, buka di tab baru`
                    : copy.footer.openInNewTab(source.name)
                }
                className={cn(
                  'text-ink-2 hover:text-brand rounded-ctl font-medium no-underline transition-colors duration-150',
                  focusRing,
                )}
              >
                {source.name}
              </a>
              {age ? (
                <span className="text-ink-2">{copy.footer.pulledAgo(age)}</span>
              ) : null}
            </span>
          )
        })}
      </p>
      <SessionControl />
    </div>
  )
}
