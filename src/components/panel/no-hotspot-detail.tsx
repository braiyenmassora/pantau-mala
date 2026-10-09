import { MapPin, ShieldCheck } from 'lucide-react'

import { EmptyState } from '@/components/common'
import { copy } from '@/copy/id'
import type { CatalogKabKota } from '@/data/types'
import { formatCoordinates } from '@/lib/format'

type NoHotspotDetailProps = {
  kab: CatalogKabKota
}

export function NoHotspotDetail({ kab }: NoHotspotDetailProps) {
  const [lon, lat] = kab.pusat

  return (
    <div className="animate-view-in space-y-6">
      <header>
        <h2 className="text-xl font-semibold text-ink">{kab.nama}</h2>
        <p className="mt-1 flex items-center gap-1 text-sm text-ink-2">
            <MapPin className="size-4 shrink-0 text-ink-2" strokeWidth={2} aria-hidden />
          <span>
            {kab.provinsi}
            {' · '}
            <span className="font-mono text-xs">
              {formatCoordinates(lon, lat)}
            </span>
          </span>
        </p>
      </header>
      <EmptyState
        icon={ShieldCheck}
        title={copy.empty.noHotspotsInRegion.title}
        description={copy.empty.noHotspotsInRegion.description(kab.nama)}
      />
    </div>
  )
}
