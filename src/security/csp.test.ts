import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const headers = readFileSync(new URL('../../public/_headers', import.meta.url), 'utf8')

describe('frontend content security policy', () => {
  it('allows browser PUT uploads only to the configured R2 account endpoint', () => {
    expect(headers).toMatch(
      /connect-src[^;]*https:\/\/840ff00b21969ff808e3b4fca131d95c\.r2\.cloudflarestorage\.com/,
    )
  })
})
