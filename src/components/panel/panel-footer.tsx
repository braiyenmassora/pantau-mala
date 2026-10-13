import { SessionControl } from '@/auth/access-gate'
import { CloudSun, Satellite } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { focusRing } from '@/components/common/focus-ring'
import { copy } from '@/copy/id'
import { cn } from '@/lib/utils'

/** Urutan sama `copy.footer.sources`. */
const SOURCE_ICONS: LucideIcon[] = [Satellite, CloudSun]

export function PanelFooter() {
  return (
    <footer className={cn('border-line bg-surface shrink-0 border-t px-4 py-2 text-xs')}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-x-3 text-ink-2">
          {copy.footer.sources.map((source, i) => {
            const Icon = SOURCE_ICONS[i] ?? Satellite
            return (
              <a
                key={source.href}
                href={source.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={copy.footer.openInNewTab(source.name)}
                className={cn(
                  'text-ink-2 inline-flex items-center gap-1 font-medium no-underline hover:text-brand transition-colors duration-150',
                  focusRing,
                  'rounded-ctl',
                )}
              >
                <Icon className="size-4 shrink-0" strokeWidth={2} aria-hidden />
                <span>{source.name}</span>
              </a>
            )
          })}
        </p>
      </div>
      <SessionControl />
    </footer>
  )
}
