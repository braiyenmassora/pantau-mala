import { SessionControl } from '@/auth/session-control'
import { focusRing } from '@/components/common/focus-ring'
import { copy } from '@/copy/id'
import { cn } from '@/lib/utils'

const SOURCE_ICON: Record<(typeof copy.footer.sources)[number]['id'], string> = {
  firms: '/sources/nasa-firms.png',
  weather: '/sources/open-meteo.png',
}

/** Footer panel: tautan sumber data. Rujukan resmi hanya di detail wilayah. */
export function PanelFooter() {
  return (
    <footer className="border-line bg-surface shrink-0 space-y-3 border-t px-4 py-3">
      <p
        className="text-ink-2 flex flex-wrap items-center gap-x-1 gap-y-1 text-xs leading-4"
        data-testid="panel-data-sources"
      >
        <span className="font-medium">{copy.footer.dataSourcesLabel}:</span>
        {copy.footer.sources.map((source, index) => (
          <span key={source.href} className="inline-flex items-center gap-1">
            {index > 0 ? (
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
                'hover:text-brand inline-flex min-h-11 items-center gap-2 py-1 font-medium no-underline transition-colors duration-150',
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
          </span>
        ))}
      </p>
      <SessionControl />
    </footer>
  )
}
