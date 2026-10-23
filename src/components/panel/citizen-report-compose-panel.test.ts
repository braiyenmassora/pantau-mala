import { describe, expect, it } from 'vitest'

import { isAllowedReportPhoto } from '@/lib/report-photo'

function file(name: string, type: string, size = 100) {
  return new File([new Uint8Array(size)], name, { type })
}

describe('isAllowedReportPhoto', () => {
  it('accepts jpeg/png/webp and jpg/pjpeg aliases', () => {
    expect(isAllowedReportPhoto(file('a.jpg', 'image/jpeg'))).toBe(true)
    expect(isAllowedReportPhoto(file('a.jpg', 'image/jpg'))).toBe(true)
    expect(isAllowedReportPhoto(file('a.jpg', 'image/pjpeg'))).toBe(true)
    expect(isAllowedReportPhoto(file('a.png', 'image/png'))).toBe(true)
    expect(isAllowedReportPhoto(file('a.webp', 'image/webp'))).toBe(true)
  })

  it('accepts empty MIME when extension is known', () => {
    expect(isAllowedReportPhoto(file('shot.JPG', ''))).toBe(true)
    expect(isAllowedReportPhoto(file('shot.heic', ''))).toBe(false)
  })

  it('rejects oversize and heic mime', () => {
    expect(isAllowedReportPhoto(file('a.jpg', 'image/jpeg', 2 * 1024 * 1024 + 1))).toBe(
      false,
    )
    expect(isAllowedReportPhoto(file('a.heic', 'image/heic'))).toBe(false)
  })
})
