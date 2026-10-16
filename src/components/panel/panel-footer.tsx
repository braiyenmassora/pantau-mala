import { SessionControl } from '@/auth/session-control'
import { focusRing } from '@/components/common/focus-ring'
import { copy } from '@/copy/id'
import { cn } from '@/lib/utils'

const SOURCE_ICON: Record<(typeof copy.footer.sources)[number]['id'], string> = {
  firms: '/sources/nasa-firms.png',
  weather: '/sources/open-meteo.png',
  bmkg: '/sources/bmkg.png',
}

/** Footer panel: tautan sumber data. Umur data + atribusi basemap di pojok peta. */
export function PanelFooter() {
  return (
    <footer className="border-line bg-surface shrink-0 space-y-2 border-t px-4 py-3">
      <ul
        className="flex flex-wrap items-center gap-x-3 gap-y-1"
        data-testid="panel-data-sources"
      >
        {copy.footer.sources.map((source) => (
          <li key={source.href}>
            <a
              href={source.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={copy.footer.openInNewTab(source.name)}
              className={cn(
                'text-ink-2 hover:text-brand inline-flex min-h-6 items-center gap-2 py-1 text-xs leading-4 font-medium no-underline transition-colors duration-150',
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
          </li>
        ))}
      </ul>
      <SessionControl />
    </footer>
  )
}
