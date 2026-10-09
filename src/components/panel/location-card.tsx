import { Crosshair } from 'lucide-react'
import type { RefObject } from 'react'
import { useMemo } from 'react'

import type { MapRef } from '@/components/ui/map'
import { useTitikPanas } from '@/data/queries'
import type { Region } from '@/data/types'
import { formatNumber } from '@/lib/format'
import {
  INDONESIA_CENTER,
  INDONESIA_ZOOM,
} from '@/lib/indonesia-view'
import { computeNearby } from '@/lib/nearby'
import { usePrefersReducedMotion } from '@/lib/prefers-reduced-motion'
import { RISK_CATEGORIES } from '@/lib/risk-category'
import { useMapStore } from '@/store/map'

type LocationCardProps = {
  regions: Region[]
  mapRef: RefObject<MapRef | null>
}

export function LocationCard({ regions, mapRef }: LocationCardProps) {
  const location = useMapStore((s) => s.location)
  const setLocation = useMapStore((s) => s.setLocation)
  const select = useMapStore((s) => s.select)
  const reducedMotion = usePrefersReducedMotion()
  const { data: hotspots } = useTitikPanas()

  const nearby = useMemo(() => {
    if (location.status !== 'active' || !location.coords || !hotspots) return null
    return computeNearby(location.coords, hotspots.features, regions)
  }, [location, hotspots, regions])

  if (location.status === 'denied') {
    return (
      <section className="animate-view-in rounded-card bg-surface-muted p-4 text-sm leading-5 text-ink">
        Akses lokasi ditolak. Cari kabupaten/kota lewat kolom pencarian, atau
        aktifkan lokasi di pengaturan browser.
      </section>
    )
  }

  if (location.status === 'error') {
    return (
      <section className="animate-view-in rounded-card bg-surface-muted p-4 text-sm leading-5 text-ink">
        Lokasi belum bisa didapat. Coba lagi nanti atau cari kabupaten/kota lewat
        kolom pencarian.{' '}
        <button
          type="button"
          className="font-semibold text-brand underline-offset-2 hover:underline"
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
    const badge = userRegion ? RISK_CATEGORIES[userRegion.kategori] : null

    return (
      <section className="animate-view-in rounded-card border border-line bg-surface p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[12px] leading-4 font-medium text-brand">
              <span className="size-1.5 rounded-full bg-brand" aria-hidden />
              Di sekitar kamu
            </p>
            <p className="mt-1 text-base leading-6 font-semibold text-ink">
              {userRegion?.nama ?? 'Lokasi kamu'}
            </p>
          </div>
          {badge && (
            <span
              className="inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-[12px] leading-4 font-semibold"
              style={{ backgroundColor: badge.tint, color: badge.text }}
            >
              {badge.label}
            </span>
          )}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-card bg-surface-muted p-3">
            <p className="text-[12px] leading-4 font-medium text-ink-2">
              Dalam radius 25 km
            </p>
            <p className="mt-1 text-base leading-6 font-semibold text-ink">
              {formatNumber(nearby.hotspotCount)}
              <span className="ml-1 text-[12px] leading-4 font-normal text-ink-2">
                titik panas
              </span>
            </p>
          </div>
          <div className="rounded-card bg-surface-muted p-3">
            {nearby.nearest && nearestRegion ? (
              <>
                <p className="text-[12px] leading-4 font-medium text-ink-2">
                  Paling dekat
                </p>
                <p className="mt-1 text-base leading-6 font-semibold text-ink">
                  {formatNumber(nearby.nearest.distanceKm, {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })}
                  <span className="ml-1 text-[12px] leading-4 font-normal text-ink-2">
                    km
                  </span>
                </p>
                <p className="truncate text-[12px] leading-4 text-ink-2">
                  {nearestRegion.nama}
                </p>
              </>
            ) : (
              <p className="text-sm leading-5 text-ink-2">
                Tidak ada titik panas dalam 25 km
              </p>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!nearby.nearest || !nearestRegion}
            className="inline-flex h-9 items-center rounded-full bg-brand px-3.5 text-[13px] leading-[18px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
            onClick={() => {
              if (!nearestRegion) return
              select(nearestRegion.kode)
              mapRef.current?.flyTo({
                center: nearestRegion.pusat,
                zoom: 8,
                duration: reducedMotion ? 0 : 600,
              })
            }}
          >
            Lihat detail
          </button>
          <button
            type="button"
            className="inline-flex h-9 items-center rounded-full border border-line bg-surface px-3.5 text-[13px] leading-[18px] font-semibold text-ink hover:bg-surface-muted"
            onClick={() => {
              setLocation({ status: 'off' })
              mapRef.current?.flyTo({
                center: INDONESIA_CENTER,
                zoom: INDONESIA_ZOOM,
                duration: reducedMotion ? 0 : 600,
              })
            }}
          >
            Matikan lokasi
          </button>
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
          <p className="text-base leading-6 font-semibold text-ink">
            Risiko di sekitar kamu
          </p>
          <p className="mt-1 text-[13px] leading-[18px] text-ink-2">
            Titik panas dalam radius 25 km
          </p>
          <button
            type="button"
            className="mt-3 inline-flex h-9 items-center rounded-full bg-brand-soft px-3.5 text-[13px] leading-[18px] font-semibold text-brand hover:opacity-90"
            onClick={() => setLocation({ status: 'requesting' })}
          >
            Gunakan lokasi
          </button>
        </div>
      </div>
    </section>
  )
}
