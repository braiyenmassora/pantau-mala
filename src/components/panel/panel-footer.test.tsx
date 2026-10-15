/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { PanelFooter } from '@/components/panel/panel-footer'
import { copy } from '@/copy/id'

vi.mock('@/auth/access-gate', () => ({
  SessionControl: () => null,
}))

describe('PanelFooter', () => {
  afterEach(cleanup)

  it('lists source links with icons, without update stamp', () => {
    const { container } = render(<PanelFooter />)

    expect(screen.queryByTestId('panel-updated-stamp')).toBeNull()
    expect(screen.queryByText(/Diperbarui/)).toBeNull()
    expect(screen.getByRole('link', { name: /NASA FIRMS/ })).toBeTruthy()
    expect(screen.getByRole('link', { name: /Open-Meteo/ })).toBeTruthy()
    expect(screen.getByRole('link', { name: /BMKG/ })).toBeTruthy()
    expect(container.querySelector('img[src="/sources/nasa-firms.png"]')).toBeTruthy()
    expect(container.querySelector('img[src="/sources/open-meteo.png"]')).toBeTruthy()
    expect(container.querySelector('img[src="/sources/bmkg.png"]')).toBeTruthy()
    expect(screen.queryByText(copy.panel.limitationNote)).toBeNull()
  })
})
