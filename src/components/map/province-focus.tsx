import { useEffect, useRef } from 'react'

import { useMap } from '@/components/ui/map'
import type { CatalogProvince } from '@/data/types'
import { fitIndonesia, fitProvinceBounds } from '@/lib/indonesia-view'
import { usePrefersReducedMotion } from '@/lib/prefers-reduced-motion'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

type ProvinceFocusProps = {
  provinces: CatalogProvince[]
}

/** Zoom ke bbox provinsi saat filter/pin dipilih; kembali ke Indonesia saat "Semua". */
export function ProvinceFocus({ provinces }: ProvinceFocusProps) {
  const { map, isLoaded } = useMap()
  const province = useMapStore((s) => s.province)
  const panelOpen = useUiStore((s) => s.panelOpen)
  const reducedMotion = usePrefersReducedMotion()
  const prevRef = useRef<string | null>(null)
  /** True setelah pernah drill-in — supaya "Semua" selalu pulih kamera. */
  const drilledRef = useRef(false)

  useEffect(() => {
    if (!map || !isLoaded) return
    const prev = prevRef.current
    prevRef.current = province
    const duration = reducedMotion ? 0 : 600

    if (province === 'Semua') {
      // Jangan lawan framing awal; hanya pulih dari drill-in.
      if (drilledRef.current || (prev != null && prev !== 'Semua')) {
        drilledRef.current = false
        fitIndonesia(map, panelOpen, duration)
      }
      return
    }

    // Hanya saat ganti target — jangan re-fit tiap panelOpen / referensi provinces.
    if (prev === province) return

    const hit = provinces.find((p) => p.name === province)
    if (!hit) return
    drilledRef.current = true
    fitProvinceBounds(map, hit.bbox, panelOpen, duration)
  }, [map, isLoaded, province, provinces, panelOpen, reducedMotion])

  return null
}
