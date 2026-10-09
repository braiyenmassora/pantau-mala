import { Crosshair } from 'lucide-react'
import type { RefObject } from 'react'
import { useMemo } from 'react'

import { Badge, Button, DataTile } from '@/components/common'
import { focusRing } from '@/components/common/focus-ring'
import type { MapRef } from '@/components/ui/map'
import { useTitikPanas } from '@/data/queries'
import type { Region } from '@/data/types'
import { formatNumber } from '@/lib/format'
import { fitIndonesia, getMapPadding } from '@/lib/indonesia-view'
import { computeNearby } from '@/lib/nearby'
import { usePrefersReducedMotion } from '@/lib/prefers-reduced-motion'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

type LocationCardProps = {
  regions: Region[]
  mapRef: RefObject<MapRef | null>
}

export function LocationCard({ regions, mapRef }: LocationCardProps) {
  const location = useMapStore((s) => s.location)
  const setLocation = useMapStore((s) => s.setLocation)
  const select = useMapStore((s) => s.select)
  const panelOpen = useUiStore((s) => s.panelOpen)
  const reducedMotion = usePrefersReducedMotion()
  const { data: hotspots } = useTitikPanas()

  const nearby = useMemo(() => {
    if (location.status !== 'active' || !location.coords || !hotspots) return null
    return computeNearby(location.coords, hotspots.features, regions)
  }, [location, hotspots, regions])

  if (location.status === 'denied') {
    return (
      <section className="animate-view-in rounded-card bg-surface-muted p-4 text-sm text-ink">
        Akses lokasi ditolak. Cari kabupaten/kota lewat kolom pencarian, atau
        aktifkan lokasi di pengaturan browser.
      </section>
    )
  }

  if (location.status === 'error') {
    return (
      <section className="animate-view-in rounded-card bg-surface-muted p-4 text-sm text-ink">
        Lokasi belum bisa didapat. Coba lagi nanti atau cari kabupaten/kota lewat
        kolom pencarian.{' '}
        <button
          type="button"
          className={cn(
            'rounded-ctl font-semibold text-brand underline-offset-2',
            'transition-opacity duration-150 ease-in-out hover:underline',
            focusRing,
          )}
          onClick={() => setLocation({ status: 'requesting' })}
        >
          Coba lagi
        </button>
      </section>
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
      <section className="animate-view-in rounded-card border border-line bg-surface p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs font-medium text-brand">
              <span className="size-2 rounded-full bg-brand" aria-hidden />
              Di sekitar kamu
            </p>
            <p className="mt-1 text-base font-semibold text-ink">
              {userRegion?.nama ?? 'Lokasi kamu'}
            </p>
          </div>
          {userRegion && <Badge variant="category" category={userRegion.kategori} />}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <DataTile
            label="Dalam radius 25 km"
            value={formatNumber(nearby.hotspotCount)}
            unit="titik panas"
          />
          {nearby.nearest && nearestRegion ? (
            <DataTile label="Paling dekat">
              <p className="mt-1 text-base font-semibold text-ink">
                {formatNumber(nearby.nearest.distanceKm, {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })}
                <span className="ml-1 text-xs font-normal text-ink-2">km</span>
              </p>
              <p className="truncate text-xs text-ink-2">{nearestRegion.nama}</p>
            </DataTile>
          ) : (
            <div className="rounded-card bg-surface-muted p-3">
              <p className="text-sm text-ink-2">Tidak ada titik panas dalam 25 km</p>
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="primary"
            size="sm"
            disabled={!nearby.nearest || !nearestRegion}
            onClick={() => {
              if (!nearestRegion) return
              select(nearestRegion.kode)
              mapRef.current?.flyTo({
                center: nearestRegion.pusat,
                zoom: 8,
                padding: getMapPadding(panelOpen),
                duration: reducedMotion ? 0 : 600,
              })
            }}
          >
            Lihat detail
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setLocation({ status: 'off' })
              const map = mapRef.current
              if (!map) return
              fitIndonesia(map, panelOpen, reducedMotion ? 0 : 600)
            }}
          >
            Matikan lokasi
          </Button>
        </div>
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
          <p className="text-base font-semibold text-ink">Risiko di sekitar kamu</p>
          <p className="mt-1 text-sm text-ink-2">Titik panas dalam radius 25 km</p>
          <Button
            variant="soft"
            size="sm"
            className="mt-3"
            onClick={() => setLocation({ status: 'requesting' })}
          >
            Gunakan lokasi
          </Button>
        </div>
      </div>
    </section>
  )
}
