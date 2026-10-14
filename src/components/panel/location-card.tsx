import { Crosshair, MapPinOff } from 'lucide-react'
import { useMemo, type KeyboardEvent, type MouseEvent } from 'react'

import { Badge, Button, ProgressBar } from '@/components/common'
import { SectionLabel } from '@/components/common/section-label'
import { useHotspots, useNearbyHotspots } from '@/data/queries'
import type { Region } from '@/data/types'
import { copy } from '@/copy/id'
import { rememberFocusTrigger } from '@/lib/focus-return'
import { resolveUserCoords } from '@/lib/geolocation'
import { formatNumber } from '@/lib/format'
import { computeNearby, computeNearbyFromApi } from '@/lib/nearby'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

type LocationCardProps = {
  regions: Region[]
}

const CARD =
  'rounded-card bg-surface-muted flex min-h-[7.5rem] flex-col justify-center gap-3 p-4'

/** Kartu lokasi — state memakai dimensi kartu yang sama. */
export function LocationCard({ regions }: LocationCardProps) {
  const location = useMapStore((s) => s.location)
  const setLocation = useMapStore((s) => s.setLocation)
  const select = useMapStore((s) => s.select)
  const setPanelOpen = useUiStore((s) => s.setPanelOpen)
  const isLocationActive = location.status === 'active' && !!location.coords
  const nearbyQuery = useNearbyHotspots(
    isLocationActive ? location.coords!.lat : null,
    isLocationActive ? location.coords!.lon : null,
  )
  const { data: hotspots } = useHotspots()

  const nearby = useMemo(() => {
    if (!isLocationActive || !location.coords) return null
    if (nearbyQuery.data) {
      return computeNearbyFromApi(location.coords, nearbyQuery.data, regions)
    }
    if (hotspots) {
      return computeNearby(location.coords, hotspots.features, regions)
    }
    return null
  }, [isLocationActive, location.coords, nearbyQuery.data, hotspots, regions])

  function requestLocation(target?: HTMLElement) {
    if (target) rememberFocusTrigger(target)
    if (navigator?.permissions?.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((perm) => {
          if (perm.state === 'granted') {
            void resolveUserCoords().then((res) => {
              if (res.ok) {
                setLocation({
                  status: 'active',
                  coords: { lon: res.lon, lat: res.lat },
                })
              } else {
                setLocation({ status: 'requesting' })
              }
            })
            return
          }
          setLocation({ status: 'requesting' })
        })
        .catch(() => setLocation({ status: 'requesting' }))
    } else {
      setLocation({ status: 'requesting' })
    }
  }

  return (
    <section className="space-y-2">
      <div>
        <SectionLabel>{copy.location.nearbyLabel}</SectionLabel>
        <p className="text-ink-2 mt-1 text-xs leading-4">{copy.location.nearbyHint}</p>
      </div>

      {location.status === 'denied' && (
        <div className={CARD} role="status">
          <p className="text-ink flex items-start gap-2 text-sm font-semibold">
            <MapPinOff className="mt-0.5 size-4 shrink-0" strokeWidth={2} aria-hidden />
            <span>{copy.empty.locationDenied.title}</span>
          </p>
          <p className="text-ink-2 text-sm">{copy.empty.locationDenied.description}</p>
        </div>
      )}

      {location.status === 'error' && (
        <div className={CARD} role="alert">
          <p className="text-ink text-sm font-semibold">{copy.empty.locationError.title}</p>
          <p className="text-ink-2 text-sm">{copy.empty.locationError.description}</p>
          <Button
            variant="soft"
            size="sm"
            className="self-start"
            onClick={() => setLocation({ status: 'requesting' })}
          >
            {copy.empty.locationError.action}
          </Button>
        </div>
      )}

      {(location.status === 'off' || location.status === 'requesting') && (
        <div className={CARD}>
          {location.status === 'requesting' ? (
            <>
              <ProgressBar />
              <p className="text-ink-2 text-sm">{copy.location.loading}</p>
            </>
          ) : (
            <>
              <p className="text-ink-2 text-sm">{copy.location.riskSubtitle}</p>
              <Button
                variant="soft"
                size="sm"
                className="self-start"
                aria-label={copy.location.allowLocationFull}
                onClick={(e) => requestLocation(e.currentTarget)}
              >
                <Crosshair className="size-4" strokeWidth={2} aria-hidden />
                {copy.location.useLocation}
              </Button>
            </>
          )}
        </div>
      )}

      {location.status === 'active' && location.coords && !nearby && (
        <div className={CARD} role="status">
          <ProgressBar />
          <p className="text-ink-2 text-sm">{copy.location.loading}</p>
        </div>
      )}

      {location.status === 'active' && location.coords && nearby && (
        <ActiveNearbyCard
          regions={regions}
          nearby={nearby}
          fetching={nearbyQuery.isFetching}
          onOpen={(code, el) => {
            rememberFocusTrigger(el)
            select(code)
            setPanelOpen(true)
          }}
        />
      )}
    </section>
  )
}

function ActiveNearbyCard({
  regions,
  nearby,
  fetching,
  onOpen,
}: {
  regions: Region[]
  nearby: NonNullable<ReturnType<typeof computeNearby>>
  fetching: boolean
  onOpen: (code: string, el: HTMLElement) => void
}) {
  const detailCode = nearby.userRegionCode ?? nearby.nearest?.regionCode ?? null
  const userRegion = nearby.userRegionCode
    ? regions.find((r) => r.code === nearby.userRegionCode)
    : null
  const nearestRegion = nearby.nearest
    ? regions.find((r) => r.code === nearby.nearest!.regionCode)
    : null
  const titleRegion = userRegion ?? nearestRegion

  return (
    <div
      className={cn(
        CARD,
        detailCode && 'hover:bg-line/40 cursor-pointer transition-colors duration-150',
      )}
      role={detailCode ? 'button' : 'status'}
      tabIndex={detailCode ? 0 : undefined}
      onClick={
        detailCode
          ? (e: MouseEvent<HTMLElement>) => onOpen(detailCode, e.currentTarget)
          : undefined
      }
      onKeyDown={
        detailCode
          ? (e: KeyboardEvent<HTMLElement>) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onOpen(detailCode, e.currentTarget)
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
      {fetching && <ProgressBar className="my-1" />}
      {nearby.hotspotCount === 0 ? (
        <p className="text-ink-2 text-sm">{copy.location.nearbyNoHotspots}</p>
      ) : (
        <>
          <p
            className="text-ink truncate text-xl font-semibold"
            title={titleRegion?.name ?? copy.location.yourLocation}
          >
            {titleRegion?.name ?? copy.location.yourLocation}
          </p>
          {titleRegion && (
            <div className="space-y-1">
              <p className="text-ink-2 text-xs font-medium">{copy.location.riskLabel}</p>
              <Badge variant="category" category={titleRegion.risk_category} />
            </div>
          )}
          <p className="text-ink flex flex-wrap items-baseline gap-1.5">
            <span className="font-mono text-3xl font-semibold tabular-nums">
              {formatNumber(nearby.hotspotCount)}
            </span>
            <span className="text-base font-semibold">{copy.location.hotspotUnit}</span>
          </p>
          {nearby.nearest && (
            <p className="text-ink-2 text-xs leading-4">
              {nearestRegion
                ? copy.location.nearestLine(
                    formatNumber(nearby.nearest.distanceKm, {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    }),
                    nearestRegion.name,
                  )
                : copy.location.nearestLineNoPlace(
                    formatNumber(nearby.nearest.distanceKm, {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    }),
                  )}
            </p>
          )}
        </>
      )}
    </div>
  )
}
