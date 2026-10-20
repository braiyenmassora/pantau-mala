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

  it('lists data sources with links, without pull ages', () => {
    render(<PanelFooter />)

    expect(screen.getByText(copy.footer.sourcesLabel)).toBeTruthy()
    expect(screen.getByRole('link', { name: /NASA FIRMS/ })).toBeTruthy()
    expect(screen.getByRole('link', { name: /Open-Meteo/ })).toBeTruthy()
    expect(screen.getByRole('link', { name: /BMKG/ })).toBeTruthy()
    expect(screen.getByRole('link', { name: /Copernicus CAMS/ })).toBeTruthy()
    expect(screen.getByRole('link', { name: /Copernicus GloFAS/ })).toBeTruthy()
    expect(screen.getByRole('link', { name: /Windy/ })).toBeTruthy()
    expect(screen.getByRole('link', { name: /NASA EONET/ })).toBeTruthy()
    expect(screen.queryByRole('link', { name: /OpenStreetMap contributors/ })).toBeNull()
    expect(screen.queryByRole('link', { name: /CARTO/ })).toBeNull()
    expect(screen.queryByText(/menit lalu/)).toBeNull()
    expect(screen.queryByText(/Diagnostik browser/)).toBeNull()
  })
})
