import { LocateFixed } from 'lucide-react'
import { useMemo, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react'

import { Badge, ProgressBar } from '@/components/common'
import { focusRing } from '@/components/common/focus-ring'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { copy } from '@/copy/id'
import { useHotspots, useNearbyHotspots } from '@/data/queries'
import type { Region, RiskCategory } from '@/data/types'
import { rememberFocusTrigger } from '@/lib/focus-return'
import { formatNumber } from '@/lib/format'
import { resolveUserCoords } from '@/lib/geolocation'
import { computeNearby, computeNearbyFromApi } from '@/lib/nearby'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

type LocationCardProps = {
  regions: Region[]
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <Card aria-label={copy.location.nearbyLabel}>
      <CardHeader>
        <CardTitle>{copy.location.nearbyLabel}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

// ponytail: dekat kamu = satu kartu hasil sederhana.
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

  if (location.status === 'denied') {
    return (
      <Shell>
        <div className="flex items-center justify-between gap-3 text-left">
          <p className="text-ink-2 min-w-0 flex-1 text-sm leading-5">
            Izinkan lokasi untuk melihat titik panas di sekitarmu
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="bg-brand-soft text-brand hover:bg-brand-soft/80 h-8 shrink-0 rounded-full border-transparent px-3 text-xs font-medium"
            onClick={(e) => requestLocation(e.currentTarget)}
          >
            Izinkan
          </Button>
        </div>
      </Shell>
    )
  }

  if (location.status === 'error') {
    return (
      <Shell>
        <div className="flex items-center justify-between gap-3 text-left">
          <p className="text-ink-2 min-w-0 flex-1 text-sm leading-5">
            {copy.empty.locationError.description}
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="bg-brand-soft text-brand hover:bg-brand-soft/80 h-8 shrink-0 rounded-full border-transparent px-3 text-xs font-medium"
            onClick={() => setLocation({ status: 'requesting' })}
          >
            {copy.empty.locationError.action}
          </Button>
        </div>
      </Shell>
    )
  }

  if (location.status === 'off' || location.status === 'requesting') {
    return (
      <Shell>
        <div className="flex items-center justify-between gap-3 text-left">
          <p className="text-ink-2 min-w-0 flex-1 text-sm leading-5">
            {location.status === 'requesting'
              ? copy.location.loading
              : copy.location.riskSubtitle}
          </p>
          {location.status === 'requesting' ? (
            <span className="text-ink-3 shrink-0 text-xs">{copy.location.loading}</span>
          ) : (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="bg-brand-soft text-brand hover:bg-brand-soft/80 h-8 shrink-0 rounded-full border-transparent px-3 text-xs font-medium"
              aria-label={copy.location.allowLocationFull}
              onClick={(e) => requestLocation(e.currentTarget)}
            >
              <LocateFixed className="size-3.5" strokeWidth={2} aria-hidden />
              {copy.location.useLocation}
            </Button>
          )}
        </div>
      </Shell>
    )
  }

  if (location.status === 'active' && location.coords && !nearby) {
    return (
      <Shell>
        <div className="space-y-1 text-left">
          <ProgressBar />
          <p className="text-ink-2 text-xs leading-4">{copy.location.loading}</p>
        </div>
      </Shell>
    )
  }

  if (location.status === 'active' && location.coords && nearby) {
    return (
      <ActiveNearbyCard
        regions={regions}
        nearby={nearby}
        onOpen={(code, el) => {
          rememberFocusTrigger(el)
          const target = regions.find((r) => r.code === code)
          select(code, target?.province)
          setPanelOpen(true)
        }}
      />
    )
  }

  return null
}

function ActiveNearbyCard({
  regions,
  nearby,
  onOpen,
}: {
  regions: Region[]
  nearby: NonNullable<ReturnType<typeof computeNearby>>
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

  const locationText = nearestRegion?.name ?? titleRegion?.name ?? 'posisimu'
  const captionText =
    nearby.hotspotCount === 0
      ? copy.location.nearbyNoHotspots
      : nearby.nearest
        ? `${formatNumber(nearby.hotspotCount)} titik panas · ${formatNumber(nearby.nearest.distanceKm)} km di ${locationText}`
        : `${formatNumber(nearby.hotspotCount)} titik panas dekat posisimu`

  const riskCategory: RiskCategory =
    nearby.hotspotCount >= 10
      ? 'sangat_tinggi'
      : nearby.hotspotCount >= 1
        ? 'sedang'
        : 'rendah'

  return (
    <Card
      aria-label={copy.location.nearbyLabel}
      className={cn(
        detailCode &&
          'hover:bg-surface-muted cursor-pointer transition-colors duration-150',
      )}
      role={detailCode ? 'button' : undefined}
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
    >
      <CardHeader>
        <CardTitle>{copy.location.nearbyLabel}</CardTitle>
      </CardHeader>
      <CardContent
        className={cn(
          'flex items-center justify-between gap-3',
          detailCode && focusRing,
          'rounded-ctl',
        )}
      >
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-ink truncate text-sm leading-5 font-semibold">
            {titleRegion?.name ?? copy.location.nearbyLabel}
          </p>
          <p className="text-ink-2 truncate text-xs leading-4">{captionText}</p>
        </div>
        <Badge variant="category" category={riskCategory} />
      </CardContent>
    </Card>
  )
}
