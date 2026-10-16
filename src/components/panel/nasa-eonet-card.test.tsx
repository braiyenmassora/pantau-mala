/** @vitest-environment jsdom */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { NasaEonetCard } from '@/components/panel/nasa-eonet-card'
import { copy } from '@/copy/id'

function wrap() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <NasaEonetCard />
    </QueryClientProvider>,
  )
}

describe('NasaEonetCard', () => {
  afterEach(cleanup)

  it('renders closed by default and toggles on click', async () => {
    wrap()
    expect(screen.getByRole('region', { name: copy.extra.contextLabel })).toBeTruthy()
    const toggle = screen.getByRole('button', { name: copy.extra.contextShow })
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    await userEvent.click(toggle)
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
  })
})
