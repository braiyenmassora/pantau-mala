/** @vitest-environment jsdom */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { DataFreshnessBanner } from '@/components/panel/data-freshness-banner'
import { copy } from '@/copy/id'
import { META_STALE_MS } from '@/lib/format'

const useMeta = vi.fn()

vi.mock('@/data/queries', () => ({
  useMeta: () => useMeta(),
}))

function wrap(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

describe('DataFreshnessBanner', () => {
  afterEach(() => {
    cleanup()
    useMeta.mockReset()
  })

  it('hides when meta is fresh', () => {
    useMeta.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        updated_at: new Date(Date.now() - 20 * 60_000).toISOString(),
        status: { firms: 'ok', weather: 'ok', air: 'ok' },
        pulled_at: { firms: null, weather: null },
      },
    })
    const { container } = wrap(<DataFreshnessBanner />)
    expect(container.firstChild).toBeNull()
  })

  it('shows a clear stale warning', () => {
    useMeta.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        updated_at: new Date(Date.now() - META_STALE_MS - 60_000).toISOString(),
        status: { firms: 'ok', weather: 'ok', air: 'ok' },
        pulled_at: { firms: null, weather: null },
      },
    })
    wrap(<DataFreshnessBanner />)
    expect(screen.getByText(copy.empty.dataStale.title)).toBeTruthy()
    expect(screen.getByText(/bisa sudah berubah/i)).toBeTruthy()
  })

  it('shows source failure with source names', () => {
    useMeta.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        updated_at: new Date(Date.now() - 10 * 60_000).toISOString(),
        status: { firms: 'gagal', weather: 'ok', air: 'ok' },
        pulled_at: { firms: null, weather: null },
      },
    })
    wrap(<DataFreshnessBanner />)
    expect(screen.getByText(copy.empty.dataSourceFail.title)).toBeTruthy()
    expect(screen.getByText(/NASA FIRMS \(gagal\)/)).toBeTruthy()
  })
})
