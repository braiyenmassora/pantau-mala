/** @vitest-environment jsdom */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { useSession } from '@/auth/session'
import { copy } from '@/copy/id'
import { VillageWeatherPanel } from './village-weather-panel'

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

describe('VillageWeatherPanel', () => {
  afterEach(() => cleanup())

  beforeEach(() => {
    useSession.setState({
      status: 'authenticated',
      token: 'pms_synthetic-test-only',
      principal: {
        client_id: '00000000-0000-4000-8000-000000000001',
        client_slug: 'fixture',
        username: 'fixture',
        role: 'reader',
      },
      generation: 0,
    })
  })

  it('renders search input and invitation copy initially', () => {
    renderWithQuery(<VillageWeatherPanel />)
    expect(screen.getByText(copy.weather.title)).not.toBeNull()
    expect(screen.getByPlaceholderText(copy.weather.searchPlaceholder)).not.toBeNull()
    expect(screen.getByText(copy.weather.chooseLocation)).not.toBeNull()
  })
})
