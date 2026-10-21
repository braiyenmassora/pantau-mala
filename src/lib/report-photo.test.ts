/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  MAX_REPORT_PHOTO_EDGE,
  MAX_REPORT_PHOTO_OUTPUT_BYTES,
  optimizeReportPhoto,
  reportPhotoDimensions,
} from './report-photo'

describe('report photo optimization', () => {
  afterEach(() => vi.restoreAllMocks())

  it('fits a landscape photo within the configured edge', () => {
    expect(reportPhotoDimensions(3420, 2224, MAX_REPORT_PHOTO_EDGE)).toEqual({
      width: 1600,
      height: 1040,
    })
  })

  it('preserves a smaller photo dimensions', () => {
    expect(reportPhotoDimensions(800, 600, MAX_REPORT_PHOTO_EDGE)).toEqual({
      width: 800,
      height: 600,
    })
  })

  it('re-encodes the photo as a bounded WebP and closes the decoder', async () => {
    const close = vi.fn()
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn().mockResolvedValue({ width: 3420, height: 2224, close }),
    )
    const drawImage = vi.fn()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      fillStyle: '',
      fillRect: vi.fn(),
      drawImage,
    } as unknown as CanvasRenderingContext2D)
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback, type) =>
      callback(new Blob([new Uint8Array(240 * 1024)], { type: type ?? 'image/webp' })),
    )
    const source = new File([new Uint8Array(4 * 1024 * 1024)], 'kamera.jpg', {
      type: 'image/jpeg',
    })

    const result = await optimizeReportPhoto(source)

    expect(result.file.name).toBe('kamera.webp')
    expect(result.file.type).toBe('image/webp')
    expect(result.file.size).toBeLessThanOrEqual(MAX_REPORT_PHOTO_OUTPUT_BYTES)
    expect([result.outputWidth, result.outputHeight]).toEqual([1600, 1040])
    expect(drawImage).toHaveBeenCalledOnce()
    expect(close).toHaveBeenCalledOnce()
  })
})
