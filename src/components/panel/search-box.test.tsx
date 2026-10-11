/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { SearchBox } from '@/components/panel/search-box'
import type { MapRef } from '@/components/ui/map'
import { copy } from '@/copy/id'
import { useMapStore } from '@/store/map'

vi.mock('@/lib/indonesia-view', () => ({
  fitIndonesia: vi.fn(),
}))

vi.mock('@/lib/prefers-reduced-motion', () => ({
  usePrefersReducedMotion: () => true,
}))

describe('SearchBox', () => {
  afterEach(cleanup)

  beforeEach(() => {
    useMapStore.setState({
      query: '',
      selectedCode: null,
      selectedCategories: new Set(['rendah']),
      province: 'Jambi',
    })
  })

  it('shows X clear while typing and resets to home on click', async () => {
    const user = userEvent.setup()
    const mapRef = createRef<MapRef | null>()
    render(<SearchBox mapRef={mapRef} />)

    expect(screen.queryByRole('button', { name: copy.panel.searchClear })).toBeNull()

    await user.type(
      screen.getByRole('textbox', { name: copy.panel.searchPlaceholder }),
      'xyzzy',
    )
    const clear = screen.getByRole('button', { name: copy.panel.searchClear })
    expect(clear).toBeTruthy()

    await user.click(clear)
    expect(useMapStore.getState().query).toBe('')
    expect(useMapStore.getState().province).toBe('Semua')
    expect(useMapStore.getState().selectedCategories.size).toBe(0)
    expect(useMapStore.getState().selectedCode).toBeNull()
  })
})
