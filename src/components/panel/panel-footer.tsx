import { SessionControl } from '@/auth/access-gate'
import { focusRing } from '@/components/common/focus-ring'
import { MapAttribution } from '@/components/map/map-attribution'
import { copy } from '@/copy/id'
import { cn } from '@/lib/utils'

/** Footer sidebar: tautan sumber tanpa label “Sumber data:”, tanpa divider tebal. */
export function PanelFooter() {
  return (
    <footer className="border-line/60 bg-surface shrink-0 border-t px-4 py-3">
      <p className="text-ink-2 flex flex-wrap items-center gap-x-1 gap-y-1 text-xs leading-4">
        {copy.footer.sources.map((source, i) => (
          <span key={source.href} className="inline-flex items-center gap-1">
            {i > 0 ? (
              <span className="text-ink-3" aria-hidden>
                ·
              </span>
            ) : null}
            <a
              href={source.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={copy.footer.openInNewTab(source.name)}
              className={cn(
                'text-ink-2 hover:text-brand font-medium no-underline transition-colors duration-150',
                focusRing,
                'rounded-ctl',
              )}
            >
              {source.name}
            </a>
          </span>
        ))}
        <span aria-hidden>·</span>
        <MapAttribution />
      </p>
      <SessionControl />
    </footer>
  )
}
