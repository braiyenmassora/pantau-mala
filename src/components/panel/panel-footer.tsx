import { SessionControl } from '@/auth/access-gate'

import { focusRing } from '@/components/common/focus-ring'
import { copy } from '@/copy/id'
import { cn } from '@/lib/utils'

/** Footer sumber — gaya sama di semua halaman panel. */
export function PanelFooter() {
  return (
    <footer className={cn('border-line bg-surface shrink-0 border-t px-4 py-2 text-xs')}>
      <p className="text-ink-2 flex flex-wrap items-center gap-x-1 gap-y-1">
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
                'text-ink-2 font-medium no-underline hover:text-brand transition-colors duration-150',
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
