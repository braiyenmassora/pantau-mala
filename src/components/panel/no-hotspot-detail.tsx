import { ShieldCheck, X } from 'lucide-react'

import { EmptyState, HotspotStatusBadge } from '@/components/common'
import { focusRing } from '@/components/common/focus-ring'
import { DataFreshnessBanner } from '@/components/panel/data-freshness-banner'
import { CitizenReportsCard } from '@/components/panel/region-detail-panel'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { copy } from '@/copy/id'
import { useMeta } from '@/data/queries'
import type { CatalogRegency } from '@/data/types'
import { restoreFocusTrigger } from '@/lib/focus-return'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'

type NoHotspotDetailProps = {
  kab: CatalogRegency
}

/** Wilayah tanpa titik: pola kartu sama detail, heading tetap h1. */
export function NoHotspotDetail({ kab }: NoHotspotDetailProps) {
  const { data: meta } = useMeta()
  const select = useMapStore((s) => s.select)

  function handleBack() {
    select(null)
    restoreFocusTrigger()
  }

  return (
    <div className="flex flex-col">
      <div className="bg-surface sticky top-0 z-10 flex justify-end px-4 pt-3 pb-2">
        <button
          type="button"
          onClick={handleBack}
          aria-label={copy.panel.closeDetail}
          className={cn(
            'text-ink-2 hover:bg-surface-muted rounded-ctl flex size-11 shrink-0 items-center justify-center transition-colors',
            focusRing,
          )}
        >
          <X className="size-4 shrink-0" strokeWidth={2} aria-hidden />
        </button>
      </div>

      <div className="flex flex-col gap-6 px-4 pt-3 pb-6">
        <DataFreshnessBanner />

        <Card aria-label={kab.name}>
          <CardHeader>
            <h1
              className="text-ink min-w-0 truncate text-sm leading-5 font-semibold"
              title={kab.name}
            >
              {kab.name}
            </h1>
            <HotspotStatusBadge hotspots={0} />
          </CardHeader>
          <CardContent className="text-ink-2 space-y-1 text-xs leading-4">
            <p>{copy.map.regionMetaProvince(kab.province)}</p>
            <p>{copy.panel.coverageNote}</p>
          </CardContent>
        </Card>

        <CitizenReportsCard regionCode={kab.code} />

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
    </div>
  )
}
