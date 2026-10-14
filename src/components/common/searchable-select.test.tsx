/** @vitest-environment jsdom */
import { cleanup, render, screen, fireEvent } from '@testing-library/react'
import { afterEach, describe, it, expect, vi } from 'vitest'
import { SearchableSelect } from './searchable-select'

describe('SearchableSelect', () => {
  afterEach(() => cleanup())

  const options = [
    { value: 'opt1', label: 'Opsi Satu' },
    { value: 'opt2', label: 'Opsi Dua' },
    { value: 'opt3', label: 'Opsi Tiga' },
  ]

  it('renders trigger with selected value', () => {
    render(<SearchableSelect value="opt1" options={options} onChange={vi.fn()} />)
    expect(screen.getByText('Opsi Satu')).not.toBeNull()
  })

  it('opens popover and filters options when typed', () => {
    const onChange = vi.fn()
    render(<SearchableSelect value="" options={options} onChange={onChange} />)

    const trigger = screen.getByRole('button')
    fireEvent.click(trigger)

    const searchInput = screen.getByPlaceholderText('Cari...')
    expect(searchInput).not.toBeNull()

    fireEvent.change(searchInput, { target: { value: 'Dua' } })
    expect(screen.queryByText('Opsi Satu')).toBeNull()
    expect(screen.getByText('Opsi Dua')).not.toBeNull()

    fireEvent.click(screen.getByText('Opsi Dua'))
    expect(onChange).toHaveBeenCalledWith('opt2')
  })
})
