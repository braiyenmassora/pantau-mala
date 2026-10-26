/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { HotspotDetailCard } from '@/components/map/hotspot-detail-card'
import { copy } from '@/copy/id'

describe('HotspotDetailCard', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders attribute rows and report action', async () => {
    const onWriteReport = vi.fn()
    render(
      <HotspotDetailCard
        rows={[
          { label: copy.hotspotDetail.date, value: '09 Okt 2026, 14:05 WIB' },
          { label: copy.hotspotDetail.source, value: 'VIIRS NOAA-20' },
        ]}
        onWriteReport={onWriteReport}
      />,
    )
    expect(screen.getByText('VIIRS NOAA-20')).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: copy.report.panelOpen }))
    expect(onWriteReport).toHaveBeenCalledOnce()
  })
})
