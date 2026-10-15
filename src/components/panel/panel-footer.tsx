import { SessionControl } from '@/auth/access-gate'
import { focusRing } from '@/components/common/focus-ring'
import { copy } from '@/copy/id'
import { cn } from '@/lib/utils'

const SOURCE_ICON: Record<(typeof copy.footer.sources)[number]['id'], string> = {
  firms: '/sources/nasa-firms.png',
  weather: '/sources/open-meteo.png',
  bmkg: '/sources/bmkg.png',
}

/** Footer panel: divider · sumber + ikon resmi · session (stamp di peta). */
export function PanelFooter() {
  return (
    <footer className="border-line bg-surface shrink-0 space-y-2 border-t px-4 py-3">
      <p className="text-ink-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs leading-4">
        {copy.footer.sources.map((source) => (
          <a
            key={source.href}
            href={source.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={copy.footer.openInNewTab(source.name)}
            className={cn(
              'text-ink-2 hover:text-brand inline-flex items-center gap-1.5 font-medium no-underline transition-colors duration-150',
              focusRing,
              'rounded-ctl',
            )}
          >
            <img
              src={SOURCE_ICON[source.id]}
              alt=""
              width={14}
              height={14}
              className="size-3.5 shrink-0 object-contain"
              decoding="async"
            />
            {source.name}
          </a>
        ))}
      </p>
      <SessionControl />
    </footer>
  )
}
