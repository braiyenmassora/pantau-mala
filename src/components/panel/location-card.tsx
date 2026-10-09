import { Crosshair, Flame, MapPin, MapPinOff } from 'lucide-react'
import { useMemo } from 'react'

import { Badge, Button, EmptyState } from '@/components/common'
import { useTitikPanas } from '@/data/queries'
import type { Region } from '@/data/types'
import { copy } from '@/copy/id'
import { formatNumber } from '@/lib/format'
import { computeNearby } from '@/lib/nearby'
import { useMapStore } from '@/store/map'

type LocationCardProps = {
  regions: Region[]
}

export function LocationCard({ regions }: LocationCardProps) {
  const location = useMapStore((s) => s.location)
  const setLocation = useMapStore((s) => s.setLocation)
  const { data: hotspots } = useTitikPanas()

  const nearby = useMemo(() => {
    if (location.status !== 'active' || !location.coords || !hotspots) return null
    return computeNearby(location.coords, hotspots.features, regions)
  }, [location, hotspots, regions])

  if (location.status === 'denied') {
    return (
      <EmptyState
        icon={MapPinOff}
        title={copy.empty.locationDenied.title}
        description={copy.empty.locationDenied.description}
      />
    )
  }

  if (location.status === 'error') {
    return (
      <EmptyState
        icon={MapPinOff}
        title={copy.empty.locationError.title}
        description={copy.empty.locationError.description}
        action={{
          label: copy.empty.locationError.action,
          onClick: () => setLocation({ status: 'requesting' }),
        }}
      />
    )
  }

  if (location.status === 'active' && location.coords && nearby) {
    const userRegion = nearby.userRegionCode
      ? regions.find((r) => r.kode === nearby.userRegionCode)
      : null
    const nearestRegion = nearby.nearest
      ? regions.find((r) => r.kode === nearby.nearest!.regionCode)
      : null

    return (
      <section className="animate-view-in flex flex-col gap-3 rounded-card bg-surface-muted p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-xs font-medium text-brand">
              <span className="size-2 rounded-full bg-brand" aria-hidden />
              {copy.location.nearbyLabel}
            </p>
            <p className="mt-1 text-lg font-semibold text-ink">
              {userRegion?.nama ?? copy.location.yourLocation}
            </p>
          </div>
          {userRegion && <Badge variant="category" category={userRegion.kategori} />}
        </div>

        {nearby.hotspotCount === 0 ? (
          <p className="text-sm text-ink-2">{copy.location.nearbyNoHotspots}</p>
        ) : (
          <div className="grid grid-cols-2">
            <div className="pr-3">
              <div className="flex items-center gap-1 text-xs text-ink-2">
                <span>{copy.location.radius25}</span>
                <Flame className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
              </div>
              <p className="mt-1 text-lg font-semibold text-ink">
                {formatNumber(nearby.hotspotCount)}
                <span className="ml-1 text-xs font-normal text-ink-2">
                  {copy.location.hotspotUnit}
                </span>
              </p>
            </div>
            <div className="border-l border-line pl-3">
              <div className="flex items-center gap-1 text-xs text-ink-2">
                <span>{copy.location.nearest}</span>
                <MapPin className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
              </div>
              {nearby.nearest && nearestRegion ? (
                <>
                  <p className="mt-1 text-lg font-semibold text-ink">
                    {formatNumber(nearby.nearest.distanceKm, {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    })}
                    <span className="ml-1 text-xs font-normal text-ink-2">
                      {copy.location.km}
                    </span>
                  </p>
                  <p className="truncate text-xs text-ink-2">{nearestRegion.nama}</p>
                </>
              ) : null}
            </div>
          </div>
        )}
      </section>
    )
  }

  return (
    <section className="rounded-card border border-line bg-surface p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
          <Crosshair className="size-5" strokeWidth={2} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-ink">{copy.location.riskTitle}</p>
          <p className="mt-1 text-sm text-ink-2">{copy.location.riskSubtitle}</p>
          <Button
            variant="soft"
            size="sm"
            className="mt-3"
            onClick={() => setLocation({ status: 'requesting' })}
          >
            {copy.location.useLocation}
          </Button>
        </div>
      </div>
    </section>
  )
}
