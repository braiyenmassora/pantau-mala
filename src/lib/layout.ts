/**
 * Chrome layout GIS — angka harus mirror token di `src/styles/tokens.css`.
 * Dipakai padding MapLibre + posisi overlay (panel / filter / legend).
 */

/** Tailwind-aligned: mobile <640, tablet 640–1023, desktop ≥1024. */
export const BREAKPOINT = {
  /** First width where `sm:` applies. */
  sm: 640,
  /** First width where desktop panel chrome (full overlay inset) applies. */
  lg: 1024,
} as const

export const LAYOUT = {
  /** Jarak mengambang dari tepi viewport (PDF: 16). */
  gutter: 16,
  /** Lebar panel kiri (PDF: 400). */
  panelWidth: 400,
  /** Tepi kanan panel saat terbuka: gutter + width. */
  panelEdge: 416,
  /** Awal area peta/overlay saat panel terbuka: panelEdge + gutter. */
  overlayInset: 432,
  /** Ruang kanan agar legend tidak menabrak MapControls. */
  controlsClearance: 80,
  /** Kontrol peta 40×40 (PDF). */
  controlSize: 40,
  /** Sisa lebar peta minimum saat panel terbuka di tablet. */
  mapMinWidth: 280,
} as const

export type LayoutTokens = typeof LAYOUT

export function viewportWidth(): number {
  return typeof window !== 'undefined' ? window.innerWidth : BREAKPOINT.lg
}

export function isMobileWidth(width = viewportWidth()): boolean {
  return width < BREAKPOINT.sm
}

export function isTabletWidth(width = viewportWidth()): boolean {
  return width >= BREAKPOINT.sm && width < BREAKPOINT.lg
}

export function isDesktopWidth(width = viewportWidth()): boolean {
  return width >= BREAKPOINT.lg
}

/**
 * Left offset untuk chrome mengambang (filter / legend / banner)
 * saat panel terbuka — tablet tidak memakai full overlayInset 432.
 */
export function chromeLeft(panelOpen: boolean, width = viewportWidth()): number {
  if (!panelOpen || isMobileWidth(width)) return LAYOUT.gutter
  if (isDesktopWidth(width)) return LAYOUT.overlayInset
  // tablet: sisakan mapMinWidth agar peta tidak hilang
  const maxLeft = Math.max(LAYOUT.gutter, width - LAYOUT.mapMinWidth)
  return Math.min(LAYOUT.panelEdge, maxLeft)
}

/** Lebar sisa untuk filter/legend agar tidak menabrak MapControls. */
export function chromeAvailWidth(panelOpen: boolean, width = viewportWidth()): number {
  const left = chromeLeft(panelOpen, width)
  return Math.max(0, width - left - LAYOUT.gutter - LAYOUT.controlsClearance)
}
