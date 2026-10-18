import { describe, expect, it } from 'vitest'

import { OFFICIAL_REFS, POSKO_KARHUTLA } from '@/data/official-refs'

describe('official refs', () => {
  it('lists national portals and 112 without legacy menlhk domain', () => {
    const hrefs = OFFICIAL_REFS.map((r) => r.href)
    expect(hrefs).toContain('https://www.bmkg.go.id/')
    expect(hrefs).toContain('https://www.bnpb.go.id/')
    expect(hrefs).toContain('https://sipongi.gakkum.kehutanan.go.id/')
    expect(hrefs).toContain('tel:112')
    expect(hrefs.join(' ')).not.toMatch(/menlhk/)
  })

  it('keeps Posko contacts empty until verified data is provided', () => {
    expect(POSKO_KARHUTLA).toEqual([])
  })
})
