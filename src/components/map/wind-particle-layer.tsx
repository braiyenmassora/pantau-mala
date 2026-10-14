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

const PARTICLE_COUNT = 900
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
    age: Math.floor(Math.random() * 40),
    maxAge: 40 + Math.floor(Math.random() * 30),
  }
}

/**
 * Layer simulasi partikel angin dinamis (Windy stream simulation).
 * Menggambar aliran vektor angin atmosfer di atas kanvas MapLibre.
 */
export function WindParticleLayer({ regions }: WindParticleLayerProps) {
  const { map } = useMap()
  const showWind = useMapStore((s) => s.showWind)
  const reducedMotion = usePrefersReducedMotion()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const particlesRef = useRef<Particle[]>([])
  const animFrameRef = useRef<number | null>(null)

  // Hitung kecepatan angin rata-rata dari data observasi cuaca daerah aktif
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

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const rect = container.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
    }

    resize()
    map.on('resize', resize)

    // Inisialisasi sekumpulan partikel
    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => initParticle())

    // Skala kecepatan gerak partikel dari data Open-Meteo
    const speedFactor = 0.003 * Math.max(0.5, avgWindSpeedKmh / 15)

    const render = () => {
      const rect = container.getBoundingClientRect()
      const width = rect.width
      const height = rect.height

      // Fade jejak sebelumnya secara transparan
      ctx.globalCompositeOperation = 'destination-out'
      ctx.fillStyle = WIND_FADE_CLEAR
      ctx.fillRect(0, 0, width, height)

      // Gambar garis partikel baru
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = WIND_PARTICLE_COLOR
      ctx.lineWidth = 1.2
      ctx.lineCap = 'round'

      ctx.beginPath()

      const particles = particlesRef.current
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        const oldLon = p.lon
        const oldLat = p.lat

        // Pola aliran angin khatulistiwa Indonesia (monsun timur-tenggara ke barat-barat laut)
        // Diberi deviasi gelombang mikro berdasarkan lintang untuk efek streamline fluida
        const wave = Math.sin(p.lon * 0.15) * 0.4
        const u = -1.0 * (1.2 + wave) // Komponen barat
        const v = 0.35 + Math.cos(p.lat * 0.2) * 0.3 // Komponen utara

        p.lon += u * speedFactor
        p.lat += v * speedFactor
        p.age++

        // Reset partikel jika kedaluwarsa atau keluar batas NKRI
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

        const p1 = map.project([oldLon, oldLat])
        const p2 = map.project([p.lon, p.lat])

        // Hanya gambar jika berada dalam viewport layar
        if (
          p1.x >= 0 &&
          p1.x <= width &&
          p1.y >= 0 &&
          p1.y <= height
        ) {
          ctx.moveTo(p1.x, p1.y)
          ctx.lineTo(p2.x, p2.y)
        }
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
      map.off('resize', resize)
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas)
      }
      canvasRef.current = null
    }
  }, [map, showWind, reducedMotion, avgWindSpeedKmh])

  return null
}
