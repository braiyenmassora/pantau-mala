import { describe, expect, it } from 'vitest'

import {
  BREAKPOINT,
  LAYOUT,
  chromeAvailWidth,
  chromeLeft,
  isDesktopWidth,
  isMobileWidth,
  isTabletWidth,
} from '@/lib/layout'

describe('LAYOUT', () => {
  it('keeps GIS chrome arithmetic consistent with design tokens', () => {
    expect(LAYOUT.gutter).toBe(16)
    expect(LAYOUT.panelWidth).toBe(400)
    expect(LAYOUT.panelEdge).toBe(LAYOUT.gutter + LAYOUT.panelWidth)
    expect(LAYOUT.overlayInset).toBe(LAYOUT.panelEdge + LAYOUT.gutter)
    expect(LAYOUT.controlsClearance).toBe(LAYOUT.controlSize * 2)
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
    expect(left + avail).toBeLessThanOrEqual(width - LAYOUT.controlsClearance)
  })
})
