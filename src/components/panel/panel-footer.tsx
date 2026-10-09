import { Satellite } from 'lucide-react'

import { copy } from '@/copy/id'
import { cn } from '@/lib/utils'

export function PanelFooter() {
  return (
    <footer
      className={cn(
        'flex min-h-11 shrink-0 items-center border-t border-line bg-surface px-4 py-3',
        'text-xs leading-4 text-ink-2',
      )}
    >
      <p className="flex flex-wrap items-center gap-x-1 gap-y-1">
        <Satellite className="size-3.5 shrink-0 text-ink-2" strokeWidth={2} aria-hidden />
        <span>
          <span className="text-ink-2">{copy.footer.sourcePrefix}</span>{' '}
          {copy.footer.sources.map((source, i) => (
            <span key={source.href}>
              {i > 0 ? ', ' : ''}
              <a
                href={source.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={copy.footer.openInNewTab(source.name)}
                className={cn(
                  'font-medium text-ink no-underline',
                  'transition-[text-decoration-color] duration-150 ease-in-out',
                  'hover:underline hover:underline-offset-2',
                  'focus-visible:underline focus-visible:underline-offset-2 focus-visible:outline-none',
                )}
              >
                {source.name}
              </a>
            </span>
          ))}
        </span>
      </p>
    </footer>
  )
}
