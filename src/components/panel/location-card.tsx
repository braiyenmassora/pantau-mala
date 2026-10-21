import { LocateFixed } from 'lucide-react'
import { useMemo, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react'

import { Button, HotspotStatusBadge, InfoTooltip, ProgressBar } from '@/components/common'
import { focusRing } from '@/components/common/focus-ring'
import { SectionHead } from '@/components/common/section-head'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { copy } from '@/copy/id'
import { useHotspots, useNearbyHotspots } from '@/data/queries'
import type { Region, RiskCategory } from '@/data/types'
import { rememberFocusTrigger } from '@/lib/focus-return'
import { formatNumber } from '@/lib/format'
import {
  focusWilayahSearch,
  locationFromCoords,
  resolveUserCoords,
} from '@/lib/geolocation'
import { computeNearby, computeNearbyFromApi } from '@/lib/nearby'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

type LocationCardProps = {
  regions: Region[]
}

function Shell({ children, trailing }: { children: ReactNode; trailing?: ReactNode }) {
  return (
    <Card aria-label={copy.location.nearbyLabel}>
      <SectionHead title={copy.location.nearbyLabel} action={trailing} />
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function StateActions({
  onRetry,
  retryLabel,
}: {
  onRetry: (el: HTMLElement) => void
  retryLabel: string
}) {
  return (
    <div className="flex flex-col gap-2 min-[380px]:flex-row min-[380px]:flex-wrap">
      <Button
        type="button"
        variant="soft"
        size="sm"
        className="h-8 w-full shrink-0 px-3 text-xs leading-4 font-medium min-[380px]:w-auto"
        onClick={(e) => onRetry(e.currentTarget)}
      >
        {retryLabel}
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="h-8 w-full shrink-0 px-3 text-xs leading-4 font-medium shadow-none min-[380px]:w-auto"
        onClick={() => focusWilayahSearch()}
      >
        {copy.location.searchManual}
      </Button>
    </div>
  )
}

// ponytail: dekat kamu = satu kartu hasil sederhana, pola ringkasan wilayah.
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
                setLocation(locationFromCoords(res.lat, res.lon))
              } else {
                setLocation({ status: res.reason })
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

  function retryPrompt(target?: HTMLElement) {
    if (target) rememberFocusTrigger(target)
    setLocation({ status: 'requesting' })
  }

  if (location.status === 'denied') {
    return (
      <Shell>
        <div className="space-y-3 text-left">
          <p className="text-ink-2 text-xs leading-4">{copy.location.deniedBody}</p>
          <StateActions
            onRetry={requestLocation}
            retryLabel={copy.location.useLocation}
          />
        </div>
      </Shell>
    )
  }

  if (location.status === 'error') {
    return (
      <Shell>
        <div className="space-y-3 text-left">
          <p className="text-ink-2 text-xs leading-4">{copy.location.errorBody}</p>
          <StateActions onRetry={retryPrompt} retryLabel={copy.location.tryAgain} />
        </div>
      </Shell>
    )
  }

  if (location.status === 'timeout') {
    return (
      <Shell>
        <div className="space-y-3 text-left">
          <p className="text-ink-2 text-xs leading-4">{copy.location.timeoutBody}</p>
          <StateActions onRetry={retryPrompt} retryLabel={copy.location.tryAgain} />
        </div>
      </Shell>
    )
  }

  if (location.status === 'outside') {
    return (
      <Shell>
        <div className="space-y-3 text-left">
          <p className="text-ink text-sm leading-5 font-semibold">
            {copy.location.outsideTitle}
          </p>
          <p className="text-ink-2 text-xs leading-4">{copy.location.outsideBody}</p>
          <StateActions onRetry={requestLocation} retryLabel={copy.location.tryAgain} />
        </div>
      </Shell>
    )
  }

  if (location.status === 'off' || location.status === 'requesting') {
    return (
      <Shell>
        {location.status === 'requesting' ? (
          <div className="space-y-2 text-left" aria-busy="true">
            <ProgressBar />
            <p className="text-ink-2 text-xs leading-4">{copy.location.loading}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 text-left min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between">
            <p className="text-ink-2 min-w-0 flex-1 text-sm leading-5">
              {copy.location.riskSubtitle}
            </p>
            <Button
              type="button"
              variant="soft"
              size="sm"
              className="h-8 w-full shrink-0 px-3 text-xs leading-4 font-medium min-[380px]:w-auto"
              aria-label={copy.location.allowLocationFull}
              onClick={(e) => requestLocation(e.currentTarget)}
            >
              <LocateFixed
                className="panel-icon-locate size-3.5"
                strokeWidth={2}
                aria-hidden
              />
              {copy.location.useLocation}
            </Button>
          </div>
        )}
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

  const locationText = nearestRegion?.name ?? titleRegion?.name ?? null
  const nearestKm = nearby.nearest
    ? formatNumber(nearby.nearest.distanceKm, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })
    : null

  const riskCategory: RiskCategory =
    nearby.hotspotCount >= 10
      ? 'sangat_tinggi'
      : nearby.hotspotCount >= 1
        ? 'sedang'
        : 'tidak_tersedia'

  return (
    <Card
      aria-label={copy.location.nearbyLabel}
      className={cn(
        detailCode &&
          'hover:bg-surface-muted cursor-pointer transition-colors duration-150',
        detailCode && focusRing,
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
        <div className="flex min-w-0 items-center gap-1">
          <CardTitle>{copy.location.nearbyLabel}</CardTitle>
          <InfoTooltip content={copy.location.riskNearbyTip} />
        </div>
        <HotspotStatusBadge hotspots={nearby.hotspotCount} riskCategory={riskCategory} />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <p className="text-ink font-mono text-3xl leading-10 font-semibold tabular-nums">
            {formatNumber(nearby.hotspotCount)}
          </p>
          <p className="text-ink text-sm leading-5">{copy.location.hotspotUnitLine}</p>
        </div>
        {nearestKm || locationText ? (
          <div className="text-ink-2 space-y-1 text-xs leading-4">
            {nearestKm ? <p>{copy.location.nearestDistance(nearestKm)}</p> : null}
            {locationText ? (
              <p className="text-ink-2 line-clamp-2">{locationText}</p>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
