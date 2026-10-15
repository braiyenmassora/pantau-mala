/**
 * Chrome layout GIS — angka harus mirror token di `src/styles/tokens.css`.
 * Dipakai padding MapLibre + posisi overlay (panel / filter / legend).
 */
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
} as const

export type LayoutTokens = typeof LAYOUT
