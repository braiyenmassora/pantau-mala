import { focusRing } from '@/components/common/focus-ring'
import { copy } from '@/copy/id'
import { cn } from '@/lib/utils'

/** Tautan atribusi basemap (© CARTO, © OSM). */
export function MapAttributionLinks({ className }: { className?: string }) {
  return (
    <p
      data-testid="map-basemap-attribution"
      className={cn(
        'text-ink-2 flex max-w-48 flex-wrap items-center justify-end gap-x-1 text-xs leading-4',
        className,
      )}
    >
      {copy.footer.mapAttribution.map((item, i) => (
        <span key={item.id} className="inline-flex items-center gap-x-1">
          {i > 0 ? <span aria-hidden>,</span> : null}
          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={copy.footer.openInNewTab(item.name)}
            className={cn(
              'hover:text-ink-2 inline-flex min-h-6 items-center py-1 no-underline',
              focusRing,
              'rounded-ctl',
            )}
          >
            {item.name}
          </a>
        </span>
      ))}
    </p>
  )
}
