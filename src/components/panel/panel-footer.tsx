import { SessionControl } from '@/auth/access-gate'
import { focusRing } from '@/components/common/focus-ring'
import { copy } from '@/copy/id'
import { cn } from '@/lib/utils'

type SourceLogo = {
  src: string
  imageClassName: string
  linkClassName?: string
}

const sourceLogos: Record<string, SourceLogo> = {
  firms: {
    src: '/brands/nasa.svg',
    imageClassName: 'size-7',
  },
  weather: {
    src: '/brands/open-meteo.svg',
    imageClassName: 'size-5',
  },
  bmkg: {
    src: '/brands/bmkg.svg',
    imageClassName: 'h-7 w-auto',
  },
  cams: {
    src: '/brands/copernicus-cams.svg',
    imageClassName: 'size-6',
  },
  glofas: {
    src: '/brands/copernicus-glofas.svg',
    imageClassName: 'size-6',
  },
  windy: {
    src: '/brands/windy.svg',
    imageClassName: 'h-4 w-auto',
    linkClassName: 'bg-brand-windy w-14 border-transparent px-2 hover:brightness-95',
  },
  eonet: {
    src: '/brands/nasa.svg',
    imageClassName: 'size-7',
  },
}

/** Footer sidebar untuk atribusi penyedia data; atribusi basemap berada di peta. */
export function PanelFooter() {
  return (
    <footer className="panel-footer-safe border-line/60 bg-surface shrink-0 border-t px-4 py-3">
      <nav
        className="flex max-w-full items-center justify-between gap-1"
        aria-label={copy.footer.sourcesLabel}
      >
        {copy.footer.sources.map((source) => {
          const logo = sourceLogos[source.id]
          return (
            <a
              key={source.href}
              href={source.href}
              target="_blank"
              rel="noopener noreferrer"
              title={source.name}
              aria-label={copy.footer.openInNewTab(source.name)}
              className={cn(
                'border-line bg-surface hover:border-brand/40 hover:bg-brand-soft inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border transition-colors duration-150',
                logo.linkClassName,
                focusRing,
              )}
            >
              <img
                src={logo.src}
                alt=""
                width="32"
                height="32"
                decoding="async"
                draggable={false}
                className={cn('pointer-events-none object-contain', logo.imageClassName)}
              />
            </a>
          )
        })}
      </nav>
      <SessionControl />
    </footer>
  )
}
