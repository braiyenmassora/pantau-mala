/** @vitest-environment jsdom */
import { readFileSync } from 'node:fs'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { Brand } from '@/components/common/brand'
import { copy } from '@/copy/id'

describe('Brand', () => {
  afterEach(cleanup)

  it('uses the CMS wordmark asset instead of recreating the lettering with a font', () => {
    const { container } = render(<Brand />)
    const wordmark = screen.getByRole('img', { name: copy.a11y.brand })
    expect(wordmark.getAttribute('src')).toBe('/brand-wordmark.svg')
    expect(wordmark.getAttribute('height')).toBe('28')
    expect(container.querySelector('img[alt=""]')?.getAttribute('src')).toBe(
      '/brand-symbol.svg',
    )
  })

  it('keeps the compact brand within the existing panel header size', () => {
    render(<Brand compact />)
    expect(
      screen.getByRole('img', { name: copy.a11y.brand }).getAttribute('height'),
    ).toBe('20')
  })

  it('renders only the SVG wordmark for the text-only variant', () => {
    const { container } = render(<Brand textOnly />)
    expect(container.querySelectorAll('img')).toHaveLength(1)
    expect(screen.getByRole('img', { name: copy.a11y.brand }).getAttribute('src')).toBe(
      '/brand-wordmark.svg',
    )
  })

  it('keeps the favicon identical to the CMS brand symbol', () => {
    expect(readFileSync('public/favicon.svg', 'utf8')).toBe(
      readFileSync('public/brand-symbol.svg', 'utf8'),
    )
    expect(readFileSync('public/brand-wordmark.svg', 'utf8')).not.toContain('<text')
  })
})
