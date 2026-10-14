import { useEffect, useRef } from 'react'

import { useMap } from '@/components/ui/map'
import type { Region } from '@/data/types'
import { usePrefersReducedMotion } from '@/lib/prefers-reduced-motion'
import { WIND_FADE_CLEAR, WIND_PARTICLE_COLOR } from '@/lib/risk-category'
import { useMapStore } from '@/store/map'

type WindParticleLayerProps = {
  regions: Region[]
}

type Particle = {
  lon: number
  lat: number
  age: number
  maxAge: number
}

const PARTICLE_COUNT = 850
const MIN_LON = 95.0
const MAX_LON = 141.0
const MIN_LAT = -11.0
const MAX_LAT = 6.0

function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function initParticle(): Particle {
  return {
    lon: randomRange(MIN_LON, MAX_LON),
    lat: randomRange(MIN_LAT, MAX_LAT),
    age: Math.floor(Math.random() * 50),
    maxAge: 60 + Math.floor(Math.random() * 50),
  }
}

/**
 * Stream angin ala Windy: canvas 2D + fade buffer.
 * Sengaja bukan Three.js — overlay MapLibre 2D; Three.js = berat & sync kamera berlebih.
 */
export function WindParticleLayer({ regions }: WindParticleLayerProps) {
  const { map } = useMap()
  const showWind = useMapStore((s) => s.showWind)
  const reducedMotion = usePrefersReducedMotion()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const particlesRef = useRef<Particle[]>([])
  const animFrameRef = useRef<number | null>(null)

  const avgWindSpeedKmh =
    regions.reduce((acc, r) => acc + (r.weather.wind_kmh ?? 12), 0) /
    Math.max(1, regions.length)

  useEffect(() => {
    if (!showWind || !map || reducedMotion) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
        animFrameRef.current = null
      }
      return
    }

    const container = map.getContainer()
    const canvas = document.createElement('canvas')
    canvas.className = 'pointer-events-none absolute inset-0 z-10 size-full'
    container.appendChild(canvas)
    canvasRef.current = canvas

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const resize = () => {
      const rect = container.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.max(1, Math.floor(rect.width * dpr))
      canvas.height = Math.max(1, Math.floor(rect.height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const onResize = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      resize()
    }

    resize()
    map.on('resize', onResize)

    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => initParticle())

    // Segmen cukup panjang supaya ekor kebaca di zoom nasional.
    const speedFactor = 0.007 * Math.max(0.7, avgWindSpeedKmh / 14)

    const render = () => {
      const rect = container.getBoundingClientRect()
      const width = rect.width
      const height = rect.height

      // Jejak = sisa stroke frame lalu yang di-fade pelan (bukan redraw polyline).
      ctx.globalCompositeOperation = 'destination-out'
      ctx.fillStyle = WIND_FADE_CLEAR
      ctx.fillRect(0, 0, width, height)

      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = WIND_PARTICLE_COLOR
      ctx.lineWidth = 1.25
      ctx.lineCap = 'round'
      ctx.beginPath()

      const particles = particlesRef.current
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        const oldLon = p.lon
        const oldLat = p.lat

        const wave = Math.sin(p.lon * 0.15) * 0.45
        const u = -1.15 * (1.15 + wave)
        const v = 0.4 + Math.cos(p.lat * 0.22) * 0.35

        p.lon += u * speedFactor
        p.lat += v * speedFactor
        p.age++

        if (
          p.age > p.maxAge ||
          p.lon < MIN_LON ||
          p.lon > MAX_LON ||
          p.lat < MIN_LAT ||
          p.lat > MAX_LAT
        ) {
          particles[i] = initParticle()
          continue
        }

        const a = map.project([oldLon, oldLat])
        const b = map.project([p.lon, p.lat])
        if (
          (a.x < -20 && b.x < -20) ||
          (a.x > width + 20 && b.x > width + 20) ||
          (a.y < -20 && b.y < -20) ||
          (a.y > height + 20 && b.y > height + 20)
        ) {
          continue
        }

        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
      }

      ctx.stroke()
      animFrameRef.current = requestAnimationFrame(render)
    }

    animFrameRef.current = requestAnimationFrame(render)

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
        animFrameRef.current = null
      }
      map.off('resize', onResize)
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas)
      canvasRef.current = null
    }
  }, [map, showWind, reducedMotion, avgWindSpeedKmh])

  return null
}
