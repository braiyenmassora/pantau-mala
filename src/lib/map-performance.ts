const COMPACT_QUERY = '(max-width: 767px), (pointer: coarse)'

export function prefersCompactMap(): boolean {
  if (typeof window === 'undefined') return false
  if (typeof window.matchMedia !== 'function') return window.innerWidth <= 767
  return window.matchMedia(COMPACT_QUERY).matches
}

/**
 * Keep compact WebGL canvases near CSS resolution. A full-screen canvas at
 * DPR 2-3 multiplies fragment work by 4-9 while adding little useful map detail.
 */
export function mapPixelRatio(): number {
  if (typeof window === 'undefined') return 1
  const deviceRatio = Math.max(1, window.devicePixelRatio || 1)
  const compact = prefersCompactMap()
  return compact ? 1 : Math.min(deviceRatio, 2)
}
