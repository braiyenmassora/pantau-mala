import { Database, ExternalLink } from 'lucide-react'

import { SessionControl } from '@/auth/access-gate'
import { focusRing } from '@/components/common/focus-ring'
import { copy } from '@/copy/id'
import { cn } from '@/lib/utils'

/** Footer sidebar untuk atribusi penyedia data; atribusi basemap berada di peta. */
export function PanelFooter() {
  return (
    <footer className="panel-footer-safe border-line/60 bg-surface shrink-0 border-t px-4 py-3">
      <p className="text-ink-3 mb-1 flex items-center gap-1 text-xs font-semibold">
        <Database className="size-3" aria-hidden />
        {copy.footer.sourcesLabel}
      </p>
      <p className="text-ink-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs leading-4">
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
                'text-ink-2 hover:text-brand inline-flex items-center gap-1 font-medium no-underline transition-colors duration-150',
                focusRing,
                'rounded-ctl',
              )}
            >
              {source.name}
              <ExternalLink className="size-2.5" aria-hidden />
            </a>
          </span>
        ))}
      </p>
      <SessionControl />
    </footer>
  )
}
