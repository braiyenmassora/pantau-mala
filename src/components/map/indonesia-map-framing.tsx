import { useEffect, useRef } from 'react'

import { useMap } from '@/components/ui/map'
import {
  easeOutSoft,
  fitIndonesia,
  getMapPadding,
  isIndonesiaView,
  refreshFitMinZoom,
} from '@/lib/indonesia-view'
import { usePrefersReducedMotion } from '@/lib/prefers-reduced-motion'

type IndonesiaMapFramingProps = {
  panelOpen: boolean
  /** Fired once after the first fit — keep soft-loading until then to avoid a camera jump. */
  onReady?: () => void
}

/** Fits Indonesia into the visible (non-overlay) map area; keeps minZoom/padding in sync. */
export function IndonesiaMapFraming({ panelOpen, onReady }: IndonesiaMapFramingProps) {
  const { map, isLoaded } = useMap()
  const reducedMotion = usePrefersReducedMotion()
  const fitZoomRef = useRef<number | null>(null)
  const readyRef = useRef(false)
  const prevPanelRef = useRef<boolean | null>(null)
  const panelOpenRef = useRef(panelOpen)
  const onReadyRef = useRef(onReady)

  useEffect(() => {
    panelOpenRef.current = panelOpen
  }, [panelOpen])

  useEffect(() => {
    onReadyRef.current = onReady
  }, [onReady])

  useEffect(() => {
    if (!map || !isLoaded || readyRef.current) return
    fitZoomRef.current = fitIndonesia(map, panelOpenRef.current, 0)
    prevPanelRef.current = panelOpenRef.current

    // Boot overlay menutupi tile; jangan tunggu idle lama (terasa kaku).
    // idle cepat ATAU 500ms — mana dulu.
    const finish = () => {
      if (readyRef.current) return
      readyRef.current = true
      onReadyRef.current?.()
    }
    map.once('idle', finish)
    const safety = window.setTimeout(finish, 500)
    return () => {
      map.off('idle', finish)
      window.clearTimeout(safety)
    }
  }, [map, isLoaded])

  useEffect(() => {
    if (!map || !readyRef.current) return
    if (prevPanelRef.current === panelOpen) return
    prevPanelRef.current = panelOpen

    const duration = reducedMotion ? 0 : 300
    const padding = getMapPadding(panelOpen)
    const fitZoom = fitZoomRef.current

    if (fitZoom != null && isIndonesiaView(map, fitZoom)) {
      fitZoomRef.current = fitIndonesia(map, panelOpen, duration)
      return
    }

    map.easeTo({ padding, duration, easing: easeOutSoft })
    fitZoomRef.current = refreshFitMinZoom(map, panelOpen)
  }, [map, panelOpen, reducedMotion])

  useEffect(() => {
    if (!map || !isLoaded) return

    const onResize = () => {
      const open = panelOpenRef.current
      const prevFit = fitZoomRef.current
      if (prevFit != null && isIndonesiaView(map, prevFit)) {
        fitZoomRef.current = fitIndonesia(map, open, 0)
        return
      }
      fitZoomRef.current = refreshFitMinZoom(map, open)
    }

    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [map, isLoaded])

  return null
}
