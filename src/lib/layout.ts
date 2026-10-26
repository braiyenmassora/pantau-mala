/**
 * Chrome layout GIS — angka harus mirror token di `src/styles/tokens.css`.
 * Dipakai padding MapLibre + posisi overlay (panel / filter / legend).
 */

import { useEffect, useState } from 'react'

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
  /** Cadangan kanan agar filter/legend tidak menabrak tombol lokasi (zoom dihapus). */
  controlsClearance: 56,
  /** Lebar blok stamp/atribusi di bawah MapControls (mirror max-w-48) — elemen terlebar kolom itu. */
  stampWidth: 192,
  /** Kontrol peta 44×44 (touch target). */
  controlSize: 44,
  /** Sisa lebar peta minimum saat panel terbuka di tablet. */
  mapMinWidth: 280,
  /**
   * Bottom sheet mobile 3 tingkat (Maps): peek → half → full.
   * Mirror CSS: `--map-sheet-peek` / `--map-sheet-half` / `--map-sheet-full`.
   */
  /** Peek: handle + logo + bendera saja. */
  mobileSheetPeekPx: 88,
  /** Half = 50/50 peta ↔ panel (Maps mid). */
  mobileSheetHalfMaxPx: 480,
  mobileSheetHalfVh: 0.5,
  /** Full: sisakan gap atas agar peta/status bar tetap kelihatan. */
  mobileSheetTopGapPx: 48,
  mobileSheetDragThresholdPx: 48,
} as const

export type MobileSheetLevel = 'peek' | 'half' | 'full'

const SHEET_LEVELS: readonly MobileSheetLevel[] = ['peek', 'half', 'full']

/** Tinggi sheet per tingkat (px) untuk padding MapLibre + mirror CSS. */
export function mobileSheetHeightFor(
  level: MobileSheetLevel,
  height = viewportHeight(),
): number {
  if (level === 'peek') return LAYOUT.mobileSheetPeekPx
  if (level === 'full') {
    return Math.max(LAYOUT.mobileSheetPeekPx, height - LAYOUT.mobileSheetTopGapPx)
  }
  return Math.min(
    LAYOUT.mobileSheetHalfMaxPx,
    Math.round(height * LAYOUT.mobileSheetHalfVh),
  )
}

/** @deprecated pakai mobileSheetHeightFor('half') — tetap untuk pemanggil lama. */
export function mobileSheetHeightPx(height = viewportHeight()): number {
  return mobileSheetHeightFor('half', height)
}

/** Snap drag: dy < 0 = naik satu tingkat; dy > 0 = turun satu tingkat. */
export function sheetSnapFromDrag(
  dy: number,
  level: MobileSheetLevel,
  threshold = LAYOUT.mobileSheetDragThresholdPx,
): MobileSheetLevel {
  const i = SHEET_LEVELS.indexOf(level)
  const idx = i < 0 ? 1 : i
  if (dy <= -threshold) return SHEET_LEVELS[Math.min(idx + 1, SHEET_LEVELS.length - 1)]!
  if (dy >= threshold) return SHEET_LEVELS[Math.max(idx - 1, 0)]!
  return SHEET_LEVELS[idx]!
}

/** Ketuk handle: peek → half → full → peek. */
export function sheetCycleNext(level: MobileSheetLevel): MobileSheetLevel {
  const i = SHEET_LEVELS.indexOf(level)
  const idx = i < 0 ? 0 : i
  return SHEET_LEVELS[(idx + 1) % SHEET_LEVELS.length]!
}

/** Padding bawah peta mobile menurut tingkat sheet. */
export function mobileMapBottomInset(
  panelExpanded: boolean,
  height = viewportHeight(),
  level?: MobileSheetLevel,
): number {
  const resolved: MobileSheetLevel = level ?? (panelExpanded ? 'half' : 'peek')
  return mobileSheetHeightFor(resolved, height) + LAYOUT.gutter
}

export function viewportHeight(): number {
  return typeof window !== 'undefined' ? window.innerHeight : 800
}

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
  // Mobile: locate di bawah sheet — bar filter atas tidak perlu cadangan kanan 56.
  if (isMobileWidth(width)) {
    return Math.max(0, width - left - LAYOUT.gutter)
  }
  return Math.max(0, width - left - LAYOUT.gutter - LAYOUT.controlsClearance)
}

/** Lebar sisa khusus legend bawah: harus berhenti sebelum blok stamp/atribusi (lebih lebar dari tombol). */
export function chromeLegendAvailWidth(
  panelOpen: boolean,
  width = viewportWidth(),
): number {
  const left = chromeLeft(panelOpen, width)
  // Mobile: stamp sempit di bawah kontrol; stampWidth 192 menyisakan ~150px → legenda terpotong.
  if (isMobileWidth(width)) {
    return Math.max(0, width - left - LAYOUT.gutter - LAYOUT.controlsClearance)
  }
  return Math.max(0, width - left - LAYOUT.stampWidth - LAYOUT.gutter * 2)
}

/** Re-render chrome overlay saat jendela di-resize. */
export function useViewportWidth(): number {
  const [width, setWidth] = useState(viewportWidth)
  useEffect(() => {
    const onResize = () => setWidth(viewportWidth())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return width
}

/** left + maxWidth untuk filter / legend / banner — ikut resize. */
export function useMapChrome(panelOpen: boolean) {
  const width = useViewportWidth()
  return {
    width,
    left: chromeLeft(panelOpen, width),
    availWidth: chromeAvailWidth(panelOpen, width),
    legendAvailWidth: chromeLegendAvailWidth(panelOpen, width),
  }
}
