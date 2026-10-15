import { describe, expect, it } from 'vitest'

import { LAYOUT } from '@/lib/layout'

describe('LAYOUT', () => {
  it('keeps GIS chrome arithmetic consistent with design tokens', () => {
    expect(LAYOUT.gutter).toBe(16)
    expect(LAYOUT.panelWidth).toBe(400)
    expect(LAYOUT.panelEdge).toBe(LAYOUT.gutter + LAYOUT.panelWidth)
    expect(LAYOUT.overlayInset).toBe(LAYOUT.panelEdge + LAYOUT.gutter)
    expect(LAYOUT.controlsClearance).toBe(LAYOUT.controlSize * 2)
  })
})
