import { SessionControl } from '@/auth/access-gate'
import { focusRing } from '@/components/common/focus-ring'
import { copy } from '@/copy/id'
import { cn } from '@/lib/utils'

/** Footer sidebar: sumber data tanpa umur tarik, tanpa divider tebal. */
export function PanelFooter() {
  return (
    <footer className="bg-surface shrink-0 px-4 py-2">
      <p className="text-ink-2 flex flex-wrap items-center gap-x-1 gap-y-1 text-xs leading-4">
        <span className="text-ink-3">{copy.footer.sourcesLabel}</span>
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
      </p>
      <SessionControl />
    </footer>
  )
}
