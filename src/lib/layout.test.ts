import { describe, expect, it } from 'vitest'

import {
  BREAKPOINT,
  LAYOUT,
  chromeAvailWidth,
  chromeLegendAvailWidth,
  chromeLeft,
  isDesktopWidth,
  isMobileWidth,
  isTabletWidth,
  mobileMapBottomInset,
  mobileSheetHeightFor,
  mobileSheetHeightPx,
  sheetCycleNext,
  sheetSnapFromDrag,
} from '@/lib/layout'

describe('LAYOUT', () => {
  it('keeps GIS chrome arithmetic consistent with design tokens', () => {
    expect(LAYOUT.gutter).toBe(16)
    expect(LAYOUT.panelWidth).toBe(400)
    expect(LAYOUT.panelEdge).toBe(LAYOUT.gutter + LAYOUT.panelWidth)
    expect(LAYOUT.overlayInset).toBe(LAYOUT.panelEdge + LAYOUT.gutter)
    expect(LAYOUT.controlSize).toBe(44)
    // Locate 44 + jarak; zoom in/out sudah dihapus.
    expect(LAYOUT.controlsClearance).toBe(56)
  })
})

describe('mobileSheetHeightFor', () => {
  it('maps peek / half at 50/50 and coerces full → half', () => {
    expect(mobileSheetHeightFor('peek', 800)).toBe(LAYOUT.mobileSheetPeekPx)
    expect(mobileSheetHeightFor('half', 800)).toBe(
      Math.min(LAYOUT.mobileSheetHalfMaxPx, Math.round(800 * LAYOUT.mobileSheetHalfVh)),
    )
    expect(mobileSheetHeightFor('full', 800)).toBe(mobileSheetHeightFor('half', 800))
    expect(mobileSheetHeightPx(800)).toBe(mobileSheetHeightFor('half', 800))
  })

  it('uses peek/half inset when level omitted', () => {
    expect(mobileMapBottomInset(false, 800)).toBe(
      LAYOUT.mobileSheetPeekPx + LAYOUT.gutter,
    )
    expect(mobileMapBottomInset(true, 800)).toBe(
      mobileSheetHeightFor('half', 800) + LAYOUT.gutter,
    )
  })
})

describe('sheetSnapFromDrag', () => {
  it('steps only peek ↔ half', () => {
    expect(sheetSnapFromDrag(-50, 'peek')).toBe('half')
    expect(sheetSnapFromDrag(-50, 'half')).toBe('half')
    expect(sheetSnapFromDrag(50, 'half')).toBe('peek')
    expect(sheetSnapFromDrag(50, 'peek')).toBe('peek')
    expect(sheetSnapFromDrag(-50, 'full')).toBe('half')
  })

  it('toggles peek ↔ half on tap', () => {
    expect(sheetCycleNext('peek')).toBe('half')
    expect(sheetCycleNext('half')).toBe('peek')
    expect(sheetCycleNext('full')).toBe('peek')
  })
})

describe('breakpoints', () => {
  it('classifies mobile / tablet / desktop', () => {
    expect(isMobileWidth(390)).toBe(true)
    expect(isTabletWidth(390)).toBe(false)
    expect(isTabletWidth(768)).toBe(true)
    expect(isDesktopWidth(768)).toBe(false)
    expect(isDesktopWidth(BREAKPOINT.lg)).toBe(true)
    expect(isMobileWidth(BREAKPOINT.sm)).toBe(false)
  })
})

describe('chromeLeft', () => {
  it('uses gutter on mobile regardless of panel', () => {
    expect(chromeLeft(true, 390)).toBe(LAYOUT.gutter)
    expect(chromeLeft(false, 390)).toBe(LAYOUT.gutter)
  })

  it('uses full overlay inset on desktop when panel open', () => {
    expect(chromeLeft(true, 1280)).toBe(LAYOUT.overlayInset)
    expect(chromeLeft(false, 1280)).toBe(LAYOUT.gutter)
  })

  it('caps tablet inset so map keeps minimum width', () => {
    const left = chromeLeft(true, 700)
    expect(left).toBeLessThanOrEqual(LAYOUT.panelEdge)
    expect(700 - left).toBeGreaterThanOrEqual(LAYOUT.mapMinWidth)
  })
})

describe('chromeAvailWidth', () => {
  it('keeps legend/filter clear of map controls on tablet with panel open', () => {
    const width = 768
    const avail = chromeAvailWidth(true, width)
    const left = chromeLeft(true, width)
    expect(left + avail + LAYOUT.gutter + LAYOUT.controlsClearance).toBe(width)
    expect(left + avail).toBeLessThanOrEqual(
      width - LAYOUT.gutter - LAYOUT.controlsClearance,
    )
  })

  it('stops the legend before the wider stamp/attribution block', () => {
    const width = 1024
    const avail = chromeLegendAvailWidth(true, width)
    const left = chromeLeft(true, width)
    // Tepi kanan legend ≤ tepi kiri blok stamp (192) dikurangi satu gutter.
    expect(left + avail).toBeLessThanOrEqual(
      width - LAYOUT.gutter - LAYOUT.stampWidth - LAYOUT.gutter,
    )
    expect(avail).toBeGreaterThan(0)
    expect(chromeLegendAvailWidth(true, 1920)).toBeGreaterThan(avail)
  })

  it('uses control clearance on mobile so risk legend is not squeezed to ~150px', () => {
    const width = 390
    const avail = chromeLegendAvailWidth(true, width)
    const left = chromeLeft(true, width)
    expect(avail).toBe(width - left - LAYOUT.gutter - LAYOUT.controlsClearance)
    expect(avail).toBeGreaterThanOrEqual(250)
  })

  it('leaves room for stamp-sized clearance on narrow desktop with panel open', () => {
    const width = 1024
    const avail = chromeAvailWidth(true, width)
    const left = chromeLeft(true, width)
    // Legend right edge ≤ stamp left edge (stamp ≤ clearance, right-aligned).
    expect(left + avail).toBeLessThanOrEqual(
      width - LAYOUT.gutter - LAYOUT.controlsClearance,
    )
    expect(avail).toBeGreaterThan(0)
  })
})
