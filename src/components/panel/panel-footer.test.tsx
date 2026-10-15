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

    expect(screen.queryByText(copy.footer.sourcesLabel)).toBeNull()
    expect(screen.getByRole('link', { name: /NASA FIRMS/ })).toBeTruthy()
    expect(screen.getByRole('link', { name: /Open-Meteo/ })).toBeTruthy()
    expect(screen.queryByText(/menit lalu/)).toBeNull()
  })
})
