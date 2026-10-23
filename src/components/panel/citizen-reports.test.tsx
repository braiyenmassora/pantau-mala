/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CitizenReports } from '@/components/panel/citizen-reports'
import { useMapStore } from '@/store/map'

const mutate = vi.fn()
const reset = vi.fn()
const { optimizeReportPhoto } = vi.hoisted(() => ({
  optimizeReportPhoto: vi.fn(),
}))

vi.mock('@/lib/report-photo', () => ({
  REPORT_PHOTO_TYPES: new Set(['image/jpeg', 'image/png', 'image/webp']),
  MAX_REPORT_PHOTO_INPUT_BYTES: 12 * 1024 * 1024,
  optimizeReportPhoto,
  formatPhotoBytes: (bytes: number) => `${bytes} bytes`,
}))

vi.mock('@/data/hotspot-reports', () => ({
  reportPhotoSrc: (value: string) => value,
  useRegionHotspotReports: () => ({
    data: [],
    isLoading: false,
    isError: false,
  }),
  usePointHotspotReports: () => ({
    data: [],
    isLoading: false,
    isError: false,
  }),
  useHotspotReport: () => ({
    data: undefined,
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

describe('CitizenReports', () => {
  beforeEach(() => {
    optimizeReportPhoto.mockImplementation(async (file: File) => ({
      file: new File(['webp'], file.name.replace(/\.[^.]+$/, '.webp'), {
        type: 'image/webp',
      }),
      originalName: file.name,
      originalBytes: file.size,
      originalWidth: 3024,
      originalHeight: 4032,
      outputWidth: 1200,
      outputHeight: 1600,
    }))
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    useMapStore.setState({ reportHotspot: null })
  })

  it('opens the form with coordinates filled from the hotspot clicked on the map', () => {
    useMapStore.setState({
      reportHotspot: {
        lat: -3.2,
        lon: 116.2,
        time: '2026-10-19T12:00:00Z',
        frpMw: 3.2,
        satellite: 'VIIRS',
      },
    })

    render(<CitizenReports regionCode="63.02" />)

    expect(screen.getByText('Detail laporan')).toBeTruthy()
    expect(screen.getByText(/-3\.20000, 116\.20000/)).toBeTruthy()
  })

  it('shows labelled fields and a custom photo control', () => {
    useMapStore.setState({
      reportHotspot: {
        lat: -3.2,
        lon: 116.2,
        time: '2026-10-19T12:00:00Z',
        frpMw: 3.2,
        satellite: 'VIIRS',
      },
    })
    render(<CitizenReports regionCode="63.02" />)

    expect(screen.queryByText('Titik panas yang dilaporkan')).toBeNull()
    expect(screen.getByText('Titik panas terpilih')).toBeTruthy()
    expect(screen.getByLabelText(/Nama pelapor/)).toBeTruthy()
    expect(screen.getByLabelText(/Apa yang terlihat/)).toBeTruthy()
    expect(screen.getByRole('option', { name: 'Lainnya / belum yakin' })).toBeTruthy()
    expect(screen.getByLabelText(/Catatan/)).toBeTruthy()
    expect(screen.getByText('Pilih foto dari perangkat')).toBeTruthy()
    expect(screen.queryByText(/Choose File/i)).toBeNull()
    expect(
      screen.getByRole('button', { name: 'Kirim laporan' }).hasAttribute('disabled'),
    ).toBe(true)
  })

  it('optimizes a camera photo before enabling submission', async () => {
    useMapStore.setState({
      reportHotspot: {
        lat: -3.2,
        lon: 116.2,
        time: '2026-10-19T12:00:00Z',
        frpMw: 3.2,
        satellite: 'VIIRS',
      },
    })
    render(<CitizenReports regionCode="63.02" />)
    fireEvent.change(screen.getByLabelText(/Nama pelapor/), {
      target: { value: 'Sari' },
    })
    const input = screen.getByLabelText(/Pilih foto dari perangkat/)

    fireEvent.change(input, {
      target: {
        files: [
          new File([new Uint8Array(12 * 1024 * 1024 + 1)], 'besar.jpg', {
            type: 'image/jpeg',
          }),
        ],
      },
    })
    expect(screen.getByRole('alert').textContent).toContain('12 MiB')

    const cameraPhoto = new File([new Uint8Array(3 * 1024 * 1024)], 'lapangan.jpg', {
      type: 'image/jpeg',
    })
    fireEvent.change(input, {
      target: { files: [cameraPhoto] },
    })
    expect(screen.getByText('Mengoptimalkan foto…')).toBeTruthy()
    await waitFor(() => expect(screen.getByText('lapangan.jpg')).toBeTruthy())
    expect(optimizeReportPhoto).toHaveBeenCalledWith(cameraPhoto)
    expect(screen.getByText(/1200×1600/)).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Kirim laporan' }).hasAttribute('disabled'),
    ).toBe(false)
  })
})
