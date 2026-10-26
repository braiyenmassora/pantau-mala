import { CHROME } from '@/lib/pola'

/** Hover callout pin peta — shell CHROME.panel; isi di children. */
export const mapPinTip = `${CHROME.panel} z-50 flex w-max max-w-[min(280px,70vw)] flex-col items-start gap-1 px-4 py-3 text-left text-xs leading-4`

/**
 * Offset Y MapLibre agar tip di atas pin muat di canvas.
 * Positif = pin lebih rendah di layar → ruang tip di atas.
 */
export function pinTipMapOffsetY(
  mapHeight: number,
  tipHeight = 300,
  topPad = 72,
): number {
  return Math.max(0, topPad + tipHeight - mapHeight / 2)
}
