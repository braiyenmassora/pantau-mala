import { Crosshair, MapPinOff } from 'lucide-react'
import { useMemo, type KeyboardEvent, type MouseEvent } from 'react'

import {
  Badge,
  Button,
  DataTile,
  EmptyState,
  MetaLabel,
  PanelCard,
} from '@/components/common'
import { useHotspots } from '@/data/queries'
import type { Region } from '@/data/types'
import { copy } from '@/copy/id'
import { rememberFocusTrigger } from '@/lib/focus-return'
import { formatNumber } from '@/lib/format'
import { computeNearby } from '@/lib/nearby'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

type LocationCardProps = {
  regions: Region[]
}

export function LocationCard({ regions }: LocationCardProps) {
  const location = useMapStore((s) => s.location)
  const setLocation = useMapStore((s) => s.setLocation)
  const select = useMapStore((s) => s.select)
  const setPanelOpen = useUiStore((s) => s.setPanelOpen)
  const { data: hotspots } = useHotspots()

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
    const detailCode = nearby.userRegionCode ?? nearby.nearest?.regionCode ?? null
    const userRegion = nearby.userRegionCode
      ? regions.find((r) => r.code === nearby.userRegionCode)
      : null
    const nearestRegion = nearby.nearest
      ? regions.find((r) => r.code === nearby.nearest!.regionCode)
      : null
    const titleRegion = userRegion ?? nearestRegion
    const nearestElsewhere =
      nearestRegion && nearestRegion.code !== titleRegion?.code ? nearestRegion : null

    function openDetail(target: HTMLElement) {
      if (!detailCode) return
      rememberFocusTrigger(target)
      select(detailCode)
      setPanelOpen(true)
    }

    return (
      <PanelCard
        className={cn(
          'animate-view-in flex flex-col gap-3',
          detailCode && 'hover:bg-line/40 cursor-pointer transition-colors duration-150',
        )}
        role={detailCode ? 'button' : undefined}
        tabIndex={detailCode ? 0 : undefined}
        onClick={
          detailCode
            ? (e: MouseEvent<HTMLElement>) => openDetail(e.currentTarget)
            : undefined
        }
        onKeyDown={
          detailCode
            ? (e: KeyboardEvent<HTMLElement>) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  openDetail(e.currentTarget)
                }
              }
            : undefined
        }
        aria-label={
          titleRegion
            ? `${copy.location.nearbyLabel}: ${titleRegion.name}`
            : copy.location.nearbyLabel
        }
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <MetaLabel>{copy.location.nearbyLabel}</MetaLabel>
            <p
              className="text-ink mt-1 truncate text-base font-semibold"
              title={titleRegion?.name ?? copy.location.yourLocation}
            >
              {titleRegion?.name ?? copy.location.yourLocation}
            </p>
          </div>
          {titleRegion && (
            <Badge variant="category" category={titleRegion.risk_category} />
          )}
        </div>

        {nearby.hotspotCount === 0 ? (
          <p className="text-ink-2 text-sm">{copy.location.nearbyNoHotspots}</p>
        ) : (
          <div
            className={cn(
              'grid gap-2',
              nearby.nearest ? 'grid-cols-2' : 'grid-cols-1',
            )}
          >
            <DataTile
              className="bg-surface"
              label={copy.location.radius25}
              value={formatNumber(nearby.hotspotCount)}
              unit={copy.location.hotspotUnit}
            />
            {nearby.nearest ? (
              <DataTile className="bg-surface" label={copy.location.nearest}>
                <p className="text-ink mt-1 text-base font-semibold tabular-nums">
                  {formatNumber(nearby.nearest.distanceKm, {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })}
                  <span className="text-ink-2 ml-1 text-xs font-normal">
                    {copy.location.km}
                  </span>
                </p>
                {nearestElsewhere ? (
                  <p
                    className="text-ink-2 mt-1 truncate text-xs"
                    title={nearestElsewhere.name}
                  >
                    {nearestElsewhere.name}
                  </p>
                ) : null}
              </DataTile>
            ) : null}
          </div>
        )}
      </PanelCard>
    )
  }

  return (
    <EmptyState
      variant="action"
      icon={Crosshair}
      title={copy.location.riskTitle}
      description={copy.location.riskSubtitle}
      actions={
        <Button
          variant="soft"
          size="sm"
          aria-label={copy.location.allowLocationFull}
          onClick={(e) => {
            rememberFocusTrigger(e.currentTarget)
            setLocation({ status: 'requesting' })
          }}
        >
          {copy.location.useLocation}
        </Button>
      }
    />
  )
}
