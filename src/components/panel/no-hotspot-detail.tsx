import { useMeta } from '@/data/queries'
import { MapPin, ShieldCheck } from 'lucide-react'

import { EmptyState } from '@/components/common'
import { copy } from '@/copy/id'
import type { CatalogRegency } from '@/data/types'

type NoHotspotDetailProps = {
  kab: CatalogRegency
}

export function NoHotspotDetail({ kab }: NoHotspotDetailProps) {
  const { data: meta } = useMeta()
  return (
    <div className="flex flex-col gap-6 px-4 pt-2 pb-6">
      <header className="space-y-2">
        <h1
          className="text-ink line-clamp-2 text-xl leading-8 font-semibold"
          title={kab.name}
        >
          {kab.name}
        </h1>
        <p className="text-ink-2 flex items-center gap-1 text-sm leading-5">
          <MapPin className="text-ink-2 size-4 shrink-0" strokeWidth={2} aria-hidden />
          <span>{copy.map.regionMetaProvince(kab.province)}</span>
        </p>
      </header>
      <EmptyState
        icon={ShieldCheck}
        title={
          meta?.status.firms === 'ok'
            ? copy.empty.noHotspotsInRegion.title
            : copy.extra.noDataset
        }
        description={
          meta?.status.firms === 'ok'
            ? copy.empty.noHotspotsInRegion.description(kab.name)
            : copy.extra.noDatasetNote
        }
      />
    </div>
  )
}
