/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { OfficialRefsCard, OfficialRefsCompact } from '@/components/panel/official-refs'
import { copy } from '@/copy/id'

describe('OfficialRefsCompact', () => {
  afterEach(cleanup)

  it('lists official links with secure external attrs and tel for 112', () => {
    render(<OfficialRefsCompact />)
    expect(screen.getByText(copy.footer.officialLabel)).toBeTruthy()

    const bmkg = screen.getByRole('link', {
      name: copy.official.openExternal(copy.official.refs.bmkg.name),
    })
    expect(bmkg.getAttribute('href')).toBe('https://www.bmkg.go.id/')
    expect(bmkg.getAttribute('target')).toBe('_blank')
    expect(bmkg.getAttribute('rel')).toBe('noopener noreferrer')

    const sipongi = screen.getByRole('link', {
      name: copy.official.openExternal(copy.official.refs.sipongi.name),
    })
    expect(sipongi.getAttribute('href')).toBe('https://sipongi.gakkum.kehutanan.go.id/')
    expect(sipongi.getAttribute('href')).not.toMatch(/menlhk/)

    const emergency = screen.getByRole('link', {
      name: copy.official.callLabel(copy.official.refs.emergency112.name),
    })
    expect(emergency.getAttribute('href')).toBe('tel:112')
    expect(emergency.getAttribute('target')).toBeNull()
  })
})

describe('OfficialRefsCard', () => {
  afterEach(cleanup)

  it('shows blurbs, differ note, and empty Posko placeholder', () => {
    render(<OfficialRefsCard />)
    expect(screen.getByText(copy.official.title)).toBeTruthy()
    expect(screen.getByText(copy.official.differNote)).toBeTruthy()
    expect(screen.getByText(copy.official.refs.bmkg.blurb)).toBeTruthy()
    expect(screen.getByText(copy.official.refs.bnpb.blurb)).toBeTruthy()
    expect(screen.getByText(copy.official.refs.sipongi.blurb)).toBeTruthy()
    expect(screen.getByText(copy.official.refs.emergency112.blurb)).toBeTruthy()
    expect(screen.queryByText(copy.official.poskoTitle)).toBeNull()
    expect(screen.getByText(copy.official.poskoEmptyName)).toBeTruthy()
    expect(screen.getByText(copy.official.poskoEmpty)).toBeTruthy()
    expect(screen.queryByText(/KLHK/i)).toBeNull()
  })
})
