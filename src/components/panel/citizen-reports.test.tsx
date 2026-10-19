/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CitizenReports } from '@/components/panel/citizen-reports'

const mutate = vi.fn()
const reset = vi.fn()

vi.mock('@/data/hotspot-reports', () => ({
  useRegionHotspotReports: () => ({
    data: [],
    isLoading: false,
    isError: false,
  }),
  useCreateHotspotReport: () => ({
    mutate,
    reset,
    isPending: false,
    isError: false,
    isSuccess: false,
  }),
}))

vi.mock('@/data/queries', () => ({
  useHotspots: () => ({
    isLoading: false,
    data: {
      features: [
        {
          geometry: { coordinates: [116.2, -3.2] },
          properties: {
            region_code: '63.02',
            time: '2026-10-19T12:00:00Z',
          },
        },
      ],
    },
  }),
}))

describe('CitizenReports', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('shows labelled fields and a custom photo control', () => {
    render(<CitizenReports regionCode="63.02" />)
    fireEvent.click(screen.getByRole('button', { name: 'Kirim laporan' }))

    expect(screen.getByLabelText(/Nama tampilan/)).toBeTruthy()
    expect(screen.getByLabelText(/Apa yang terlihat/)).toBeTruthy()
    expect(screen.getByLabelText(/Catatan/)).toBeTruthy()
    expect(screen.getByText('Pilih foto dari perangkat')).toBeTruthy()
    expect(screen.queryByText(/Choose File/i)).toBeNull()
    expect(
      screen.getByRole('button', { name: 'Kirim laporan' }).hasAttribute('disabled'),
    ).toBe(true)
  })

  it('validates photo size before enabling submission', () => {
    render(<CitizenReports regionCode="63.02" />)
    fireEvent.click(screen.getByRole('button', { name: 'Kirim laporan' }))
    fireEvent.change(screen.getByLabelText(/Nama tampilan/), {
      target: { value: 'Sari' },
    })
    const input = screen.getByLabelText(/Pilih foto dari perangkat/)

    fireEvent.change(input, {
      target: {
        files: [
          new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'besar.jpg', {
            type: 'image/jpeg',
          }),
        ],
      },
    })
    expect(screen.getByRole('alert').textContent).toContain('melebihi batas')

    fireEvent.change(input, {
      target: { files: [new File(['foto'], 'lapangan.webp', { type: 'image/webp' })] },
    })
    expect(screen.getByText('lapangan.webp')).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Kirim laporan' }).hasAttribute('disabled'),
    ).toBe(false)
  })
})
