/** Screen-pixel halo diameter from 24h hotspot count (Sedang / Sangat tinggi only). */
export function haloDiameter(titikPanas24j: number): number {
  return Math.min(120, Math.max(40, 40 + 12 * Math.sqrt(titikPanas24j)))
}
