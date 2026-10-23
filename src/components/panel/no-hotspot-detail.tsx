import { ShieldCheck, X } from 'lucide-react'

import { EmptyState, HotspotStatusBadge, IconButton } from '@/components/common'
import { DataFreshnessBanner } from '@/components/panel/data-freshness-banner'
import { CitizenReportsCard } from '@/components/panel/region-detail-panel'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { getCopy } from '@/copy'
import { useMeta } from '@/data/queries'
import type { CatalogRegency } from '@/data/types'
import { restoreFocusTrigger } from '@/lib/focus-return'
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
      <div className="border-line bg-surface sticky top-0 z-10 flex justify-end border-b px-4 pt-3 pb-2">
        <IconButton onClick={handleBack} aria-label={getCopy().panel.closeDetail}>
          <X className="size-4 shrink-0" strokeWidth={2} aria-hidden />
        </IconButton>
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
            <p>{getCopy().map.regionMetaProvince(kab.province)}</p>
            <p>{getCopy().panel.coverageNote}</p>
          </CardContent>
        </Card>

        <CitizenReportsCard regionCode={kab.code} />

        <EmptyState
          icon={ShieldCheck}
          title={
            meta?.status.firms === 'ok'
              ? getCopy().empty.noHotspotsInRegion.title
              : getCopy().extra.noDataset
          }
          description={
            meta?.status.firms === 'ok'
              ? getCopy().empty.noHotspotsInRegion.description(kab.name)
              : getCopy().extra.noDatasetNote
          }
        />
      </div>
    </div>
  )
}
