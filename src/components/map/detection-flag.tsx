import { MapInfoCard } from '@/components/map/map-info-card'
import { copy } from '@/copy/id'
import type { Region } from '@/data/types'
import { formatDateDotTime, formatNumber } from '@/lib/format'
import { hasHotspotDetections } from '@/lib/hotspot-status'
import { cn } from '@/lib/utils'

type DetectionFlagProps = {
  region: Region
  className?: string
}

/** Callout pin terpilih — lokasi, jumlah titik, waktu update. */
export function DetectionFlag({ region, className }: DetectionFlagProps) {
  const hasDetections = hasHotspotDetections(region.hotspots_24h)
  const updatedAt = region.last_detection?.time
    ? formatDateDotTime(region.last_detection.time, region.time_zone)
    : undefined

  return (
    <div
      role="status"
      className={cn(
        'pointer-events-none absolute bottom-full left-1/2 z-30 mb-8 -translate-x-1/2',
        className,
      )}
    >
      <MapInfoCard
        title={region.name}
        meta={
          hasDetections
            ? copy.map.regionMetaHotspots(formatNumber(region.hotspots_24h))
            : copy.status.noDetections
        }
        updatedAt={updatedAt}
      />
    </div>
  )
}
