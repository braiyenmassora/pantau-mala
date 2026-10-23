import { describe, expect, it } from 'vitest'

import { guessLocale } from '@/copy'

describe('guessLocale', () => {
  it('defaults to id for Indonesian time zones', () => {
    expect(guessLocale('Asia/Jakarta', ['en-US'])).toBe('id')
    expect(guessLocale('Asia/Makassar', ['en'])).toBe('id')
    expect(guessLocale('Asia/Jayapura', [])).toBe('id')
    expect(guessLocale('Asia/Pontianak', ['fr'])).toBe('id')
  })

  it('defaults to id when browser language is Indonesian', () => {
    expect(guessLocale('Europe/London', ['id'])).toBe('id')
    expect(guessLocale('America/New_York', ['id-ID', 'en'])).toBe('id')
  })

  it('defaults to en outside Indonesia without Indonesian language', () => {
    expect(guessLocale('Europe/London', ['en-GB'])).toBe('en')
    expect(guessLocale('America/New_York', ['en-US'])).toBe('en')
    expect(guessLocale('Asia/Singapore', ['en', 'zh'])).toBe('en')
    expect(guessLocale(undefined, [])).toBe('en')
  })
})
