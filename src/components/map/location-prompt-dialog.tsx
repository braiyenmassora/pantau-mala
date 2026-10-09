import { MapPin } from 'lucide-react'

import type { RefObject } from 'react'

import type { MapRef } from '@/components/ui/map'
import { resolveUserCoords } from '@/lib/geolocation'
import { usePrefersReducedMotion } from '@/lib/prefers-reduced-motion'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

type LocationPromptDialogProps = {
  mapRef: RefObject<MapRef | null>
}

export function LocationPromptDialog({ mapRef }: LocationPromptDialogProps) {
  const status = useMapStore((s) => s.location.status)
  const setLocation = useMapStore((s) => s.setLocation)
  const panelOpen = useUiStore((s) => s.panelOpen)
  const reducedMotion = usePrefersReducedMotion()

  if (status !== 'requesting') return null

  const flyToUser = (lon: number, lat: number) => {
    mapRef.current?.flyTo({
      center: [lon, lat],
      zoom: 9,
      duration: reducedMotion ? 0 : 600,
    })
  }

  return (
    <div
      role="dialog"
      aria-labelledby="location-prompt-title"
      className={cn(
        'absolute top-[68px] z-50 w-[360px] animate-view-in rounded-panel bg-surface p-4 shadow-lg',
        panelOpen ? 'left-[432px]' : 'left-4',
      )}
    >
      <div className="flex gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
          <MapPin className="size-5" strokeWidth={2} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2
            id="location-prompt-title"
            className="text-base leading-6 font-semibold text-ink"
          >
            Lihat risiko di sekitar kamu?
          </h2>
          <p className="mt-1 text-[13px] leading-[18px] text-ink-2">
            Browser akan meminta izin lokasi untuk menampilkan titik panas dalam
            radius 25 km. Lokasi kamu tidak disimpan.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex h-9 items-center rounded-full border border-line bg-surface px-3.5 text-[13px] leading-[18px] font-semibold text-ink hover:bg-surface-muted"
              onClick={() => setLocation({ status: 'off' })}
            >
              Nanti saja
            </button>
            <button
              type="button"
              className="inline-flex h-9 items-center rounded-full bg-brand px-3.5 text-[13px] leading-[18px] font-semibold text-white hover:opacity-90"
              onClick={() => {
                void resolveUserCoords().then((result) => {
                  if (result.ok) {
                    setLocation({
                      status: 'active',
                      coords: { lon: result.lon, lat: result.lat },
                    })
                    flyToUser(result.lon, result.lat)
                    return
                  }
                  setLocation({ status: result.reason })
                })
              }}
            >
              Lanjutkan
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
