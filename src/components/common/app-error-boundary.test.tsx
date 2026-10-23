/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AppErrorBoundary } from '@/components/common/app-error-boundary'
import { copy } from '@/copy/id'

function Boom(): React.ReactNode {
  throw new Error('synthetic boom')
}

describe('AppErrorBoundary', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('shows reload fallback when a child throws', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <AppErrorBoundary>
        <Boom />
      </AppErrorBoundary>,
    )

    expect(screen.getByRole('heading', { name: copy.empty.appCrash.title })).toBeTruthy()
    expect(screen.getByText(copy.empty.appCrash.description)).toBeTruthy()
    expect(screen.getByRole('button', { name: copy.empty.appCrash.action })).toBeTruthy()
    expect(screen.queryByText(/synthetic boom/i)).toBeNull()
    expect(spy).toHaveBeenCalled()
  })
})
