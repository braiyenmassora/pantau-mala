import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const headers = readFileSync(new URL('../../public/_headers', import.meta.url), 'utf8')

describe('frontend content security policy', () => {
  it('allows browser PUT uploads only to the configured R2 account endpoint', () => {
    expect(headers).toMatch(
      /connect-src[^;]*https:\/\/840ff00b21969ff808e3b4fca131d95c\.r2\.cloudflarestorage\.com/,
    )
  })

  it('allows report photos only from the configured public R2 bucket', () => {
    expect(headers).toMatch(
      /img-src[^;]*https:\/\/pub-32d942c9574c4f02a9c7fb2e260e33e2\.r2\.dev/,
    )
  })
})
