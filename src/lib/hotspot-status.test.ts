import { describe, expect, it } from 'vitest'

import { copy } from '@/copy/id'
import {
  hasHotspotDetections,
  hotspotDotColor,
  hotspotHoverSubtitle,
  hotspotPinAria,
  hotspotPinMeta,
} from '@/lib/hotspot-status'
import { RISK_CATEGORIES } from '@/lib/risk-category'

describe('hotspot status', () => {
  it('treats zero detections as non-risk', () => {
    expect(hasHotspotDetections(0)).toBe(false)
    expect(hasHotspotDetections(1)).toBe(true)
    expect(hasHotspotDetections(null)).toBe(false)
    expect(hasHotspotDetections(undefined)).toBe(false)
  })

  it('uses neutral gray for zero-point dots, not low-risk green', () => {
    expect(
      hotspotDotColor({ risk_category: 'rendah', hotspots_24h: 0 }),
    ).toBe(RISK_CATEGORIES.tanpa_titik.dot)
    expect(
      hotspotDotColor({ risk_category: 'sedang', hotspots_24h: 3 }),
    ).toBe(RISK_CATEGORIES.sedang.dot)
    expect(
      hotspotDotColor({ risk_category: 'rendah', hotspots_24h: null }),
    ).toBe(RISK_CATEGORIES.tidak_tersedia.dot)
  })

  it('labels zero points without Risiko Rendah', () => {
    expect(hotspotHoverSubtitle({ risk_category: 'rendah', hotspots_24h: 0 })).toBe(
      RISK_CATEGORIES.tanpa_titik.label,
    )
    expect(hotspotPinMeta(0, 'Rendah')).toBe(copy.status.noDetections)
    expect(hotspotPinAria('Kab. Test', 0, 'Rendah', '0')).toBe(
      copy.map.pinAriaNoDetections('Kab. Test'),
    )
    expect(hotspotPinMeta(3, 'Sedang')).toBe(copy.map.regionPinDetails('3', 'Sedang'))
  })

  it('labels missing counts as Belum dinilai, not nol titik', () => {
    expect(hotspotHoverSubtitle({ risk_category: 'rendah', hotspots_24h: null })).toBe(
      RISK_CATEGORIES.tidak_tersedia.label,
    )
    expect(hotspotPinMeta(null, 'Rendah')).toBe(RISK_CATEGORIES.tidak_tersedia.label)
    expect(hotspotPinAria('Kab. Test', undefined, 'Rendah', '—')).toBe(
      `Kab. Test, ${RISK_CATEGORIES.tidak_tersedia.label}`,
    )
  })
})
