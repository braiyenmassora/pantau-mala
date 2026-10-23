/** @vitest-environment jsdom */
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { PanelFooter } from '@/components/panel/panel-footer'
import { copy } from '@/copy/id'

vi.mock('@/auth/session-control', () => ({
  SessionControl: () => null,
}))

describe('PanelFooter', () => {
  afterEach(cleanup)

  it('lists source links with icons, without update stamp', () => {
    const { container } = render(<PanelFooter />)

    expect(screen.queryByTestId('panel-updated-stamp')).toBeNull()
    expect(screen.queryByText(/Diperbarui/)).toBeNull()
    const dataSources = screen.getByTestId('panel-data-sources')
    expect(within(dataSources).getByText(`${copy.footer.dataSourcesLabel}:`)).toBeTruthy()
    expect(within(dataSources).getByRole('link', { name: /NASA FIRMS/ })).toBeTruthy()
    expect(within(dataSources).getByRole('link', { name: /Open-Meteo/ })).toBeTruthy()
    expect(within(dataSources).getByRole('link', { name: /Windy/ })).toBeTruthy()
    expect(within(dataSources).queryByRole('link', { name: /BMKG/ })).toBeNull()
    expect(container.querySelector('img[src="/sources/nasa-firms.png"]')).toBeTruthy()
    expect(container.querySelector('img[src="/sources/open-meteo.png"]')).toBeTruthy()
    expect(container.querySelector('img[src="/sources/windy.png"]')).toBeTruthy()
    expect(container.querySelector('img[src="/sources/bmkg.png"]')).toBeNull()
    expect(screen.queryByText(copy.panel.limitationNote)).toBeNull()
  })

  it('does not show Sumber resmi (hanya di detail wilayah)', () => {
    render(<PanelFooter />)
    expect(screen.queryByTestId('official-refs-compact')).toBeNull()
    expect(screen.queryByText(copy.footer.officialLabel)).toBeNull()
  })
})
