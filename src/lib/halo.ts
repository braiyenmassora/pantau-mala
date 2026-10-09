import type { RiskCategory } from '@/data/types'

/** Minimum 24h hotspot count before a size circle is drawn (all categories). */
export const HALO_MIN_TITIK = 5

/** Screen-pixel halo diameter from 24h hotspot count. */
export function haloDiameter(titikPanas24j: number): number {
  return Math.min(120, Math.max(40, 40 + 12 * Math.sqrt(titikPanas24j)))
}

/** Circle shows for every risk category once hotspot count reaches the floor. */
export function showHalo(titikPanas24j: number): boolean {
  return titikPanas24j >= HALO_MIN_TITIK
}

/** Pulse ring only for Sedang and Sangat tinggi (not Rendah). */
export function showHaloPulse(kategori: RiskCategory): boolean {
  return kategori !== 'rendah'
}
