/** True only when the browser can create a WebGL context. */
export function webGlSupported(): boolean {
  if (typeof document === 'undefined') return true
  try {
    const canvas = document.createElement('canvas')
    return !!(
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')
    )
  } catch {
    return false
  }
}

/**
 * Style/basemap failure (no sourceId) vs transient tile/source errors.
 * Tile misses must not kill the map.
 */
export function isBasemapStyleError(event: unknown): boolean {
  if (!event || typeof event !== 'object') return false
  const e = event as { error?: Error | string | { message?: string }; sourceId?: string }
  if (e.sourceId) return false
  const raw = e.error
  const msg =
    typeof raw === 'string'
      ? raw
      : raw && typeof raw === 'object' && 'message' in raw
        ? String(raw.message ?? '')
        : String(raw ?? '')
  return msg.length === 0 || /style|failed to fetch|404|cors|network|load|ajax/i.test(msg)
}
