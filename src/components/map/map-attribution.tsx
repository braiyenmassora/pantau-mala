import { focusRing } from '@/components/common/focus-ring'
import { copy } from '@/copy/id'
import { cn } from '@/lib/utils'

export function MapAttribution() {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-1">
      {copy.footer.mapSources.map((source, index) => (
        <span key={source.href} className="inline-flex items-center gap-1">
          {index > 0 && <span aria-hidden>·</span>}
          <a
            href={source.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={copy.footer.openInNewTab(source.name)}
            className={cn('hover:text-brand rounded-ctl no-underline', focusRing)}
          >
            {source.name}
          </a>
        </span>
      ))}
    </span>
  )
}
