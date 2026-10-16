// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { requestSignal, timeoutSignal } from './abort'

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

it('supports browsers without AbortSignal.timeout and AbortSignal.any', async () => {
  vi.useFakeTimers()
  vi.stubGlobal('AbortSignal', {})
  const timeout = timeoutSignal(100)
  expect(timeout.aborted).toBe(false)
  await vi.advanceTimersByTimeAsync(100)
  expect(timeout.aborted).toBe(true)
  const parent = new AbortController()
  const combined = requestSignal(parent.signal, 1000)
  parent.abort()
  expect(combined.aborted).toBe(true)
  expect(requestSignal(parent.signal, 1000).aborted).toBe(true)
})
