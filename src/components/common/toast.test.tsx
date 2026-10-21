/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { Toast } from '@/components/common/toast'
import { copy } from '@/copy/id'
import { useToastStore } from '@/store/toast'

describe('Toast', () => {
  beforeEach(() => {
    useToastStore.setState({ title: null, description: null, tone: 'ok' })
  })
  afterEach(cleanup)

  it('renders nothing without a message', () => {
    render(<Toast />)
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('shows the rate-limit message and dismisses on close', async () => {
    useToastStore
      .getState()
      .showToast(copy.report.rateLimitedTitle, copy.report.rateLimited, 'err')
    render(<Toast />)
    expect(screen.getByRole('alert').textContent).toContain(
      'Batas permintaan tercapai',
    )
    expect(screen.getByRole('alert').textContent).toContain('5× per jam')
    await userEvent.click(
      screen.getByRole('button', { name: copy.common.dismissNotification }),
    )
    expect(screen.queryByRole('alert')).toBeNull()
  })
})
