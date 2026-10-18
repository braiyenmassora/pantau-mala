import type { RiskCategory } from '@/data/types'

/** Minimum 24h hotspot count before a size circle is drawn (all categories). */
export const HALO_MIN_TITIK = 5

/**
 * Screen-pixel halo diameter from 24h hotspot count.
 * Cap ~52 so dense kab (Papua/Kalimantan) tidak saling menutupi pin.
 */
export function haloDiameter(hotspots24h: number): number {
  return Math.min(52, Math.max(28, 28 + 5 * Math.sqrt(hotspots24h)))
}

/** Circle shows for every risk category once hotspot count reaches the floor. */
export function shouldShowHalo(hotspots24h: number): boolean {
  return hotspots24h >= HALO_MIN_TITIK
}

/** Semua kategori pin memakai riak soft-pulse (termasuk rendah / tanpa titik). */
export function showHaloPulse(
  category?: RiskCategory,
  hotspots24h?: number,
): boolean {
  void category
  void hotspots24h
  return true
}
