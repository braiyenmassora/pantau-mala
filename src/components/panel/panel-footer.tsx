import { Cloud, CloudSun, Flame, Orbit, RadioTower, Waves, Wind } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { SessionControl } from '@/auth/access-gate'
import { focusRing } from '@/components/common/focus-ring'
import { copy } from '@/copy/id'
import { cn } from '@/lib/utils'

const sourceIcons: Record<string, LucideIcon> = {
  firms: Flame,
  weather: CloudSun,
  bmkg: RadioTower,
  cams: Cloud,
  glofas: Waves,
  windy: Wind,
  eonet: Orbit,
}

/** Footer sidebar untuk atribusi penyedia data; atribusi basemap berada di peta. */
export function PanelFooter() {
  return (
    <footer className="panel-footer-safe border-line/60 bg-surface shrink-0 border-t px-4 py-3">
      <nav className="flex items-center gap-2" aria-label={copy.footer.sourcesLabel}>
        {copy.footer.sources.map((source) => {
          const Icon = sourceIcons[source.id] ?? Orbit
          return (
            <a
              key={source.href}
              href={source.href}
              target="_blank"
              rel="noopener noreferrer"
              title={source.name}
              aria-label={copy.footer.openInNewTab(source.name)}
              className={cn(
                'border-line bg-surface-muted text-ink-2 hover:border-brand/40 hover:bg-brand-soft hover:text-brand inline-flex size-8 items-center justify-center rounded-full border transition-colors duration-150',
                focusRing,
              )}
            >
              <Icon className="size-4" strokeWidth={1.8} aria-hidden />
            </a>
          )
        })}
      </nav>
      <SessionControl />
    </footer>
  )
}
