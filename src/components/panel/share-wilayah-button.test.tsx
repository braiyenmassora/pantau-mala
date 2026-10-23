/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ShareWilayahButton } from '@/components/panel/share-wilayah-button'
import { copy } from '@/copy/id'

describe('ShareWilayahButton', () => {
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('uses navigator.share when available and ignores abort', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError'))
    vi.stubGlobal('navigator', { ...navigator, share })
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)

    render(<ShareWilayahButton name="Kab. Pulang Pisau" code="62.11" />)
    await userEvent.click(screen.getByRole('button', { name: copy.share.button }))

    expect(share).toHaveBeenCalled()
    expect(open).not.toHaveBeenCalled()
    expect(screen.queryByText(copy.share.whatsappFallback)).toBeNull()
  })

  it('falls back to WhatsApp with neutral text and link', async () => {
    vi.stubGlobal('navigator', { ...navigator, share: undefined })
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)

    render(<ShareWilayahButton name="Kab. Pulang Pisau" code="62.11" />)
    await userEvent.click(screen.getByRole('button', { name: copy.share.button }))

    expect(open).toHaveBeenCalled()
    const url = String(open.mock.calls[0]?.[0] ?? '')
    expect(url).toMatch(/^https:\/\/wa\.me\/\?text=/)
    const decoded = decodeURIComponent(url)
    expect(decoded).toContain(copy.share.text('Kab. Pulang Pisau'))
    expect(decoded).toContain('Bukan peringatan resmi kebakaran')
    expect(decoded).not.toMatch(/tidak ada titik|Sangat tinggi|Rendah|aman|risiko/i)
    expect(decoded).toMatch(/\/wilayah\//)
    expect(screen.getByText(copy.share.whatsappFallback)).toBeTruthy()
  })

  it('uses the same neutral text when region has zero hotspots', async () => {
    vi.stubGlobal('navigator', { ...navigator, share: undefined })
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)

    render(<ShareWilayahButton name="Kab. Kosong" code="62.99" variant="icon" />)
    await userEvent.click(screen.getByRole('button', { name: copy.share.button }))

    const url = String(open.mock.calls[0]?.[0] ?? '')
    const decoded = decodeURIComponent(url)
    expect(decoded).toContain(copy.share.text('Kab. Kosong'))
    expect(decoded).not.toMatch(/tidak ada titik|aman|Rendah/i)
  })
})
