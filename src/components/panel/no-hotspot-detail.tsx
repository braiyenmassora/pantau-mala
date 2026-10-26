import { ShieldCheck, X } from 'lucide-react'

import { CloseIconButton, EmptyState, HotspotStatusBadge } from '@/components/common'
import { DataFreshnessBanner } from '@/components/panel/data-freshness-banner'
import { CitizenReportsCard } from '@/components/panel/region-detail-panel'
import { Card, CardContent } from '@/components/ui/card'
import { getCopy } from '@/copy'
import { useMeta } from '@/data/queries'
import type { CatalogRegency } from '@/data/types'
import { restoreFocusTrigger } from '@/lib/focus-return'
import { PANEL, T } from '@/lib/pola'
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
      <div
        className={cn(
          PANEL.stickyHeader,
          PANEL.pad,
          PANEL.header,
          'flex items-center gap-2',
        )}
      >
        <h1 className={cn(T.title, 'min-w-0 flex-1 truncate')} title={kab.name}>
          {kab.name}
        </h1>
        <HotspotStatusBadge hotspots={0} />
        <CloseIconButton onClick={handleBack} aria-label={getCopy().panel.closeDetail}>
          <X className="size-4 shrink-0" strokeWidth={2} aria-hidden />
        </CloseIconButton>
      </div>

      <div className={cn(PANEL.body, PANEL.pad)}>
        <DataFreshnessBanner />

        <Card aria-label={kab.name}>
          <CardContent className="space-y-1">
            <p className={T.quiet}>{getCopy().map.regionMetaProvince(kab.province)}</p>
            <p className={T.quiet}>{getCopy().panel.coverageNote}</p>
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
