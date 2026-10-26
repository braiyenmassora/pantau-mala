import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import {
  chartScaleMax,
  formatDateDotTime,
  formatDateTime,
  formatNumber,
  formatRelativeAge,
} from '@/lib/format'

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '../..')
const FORMAT_MODULE = resolve(ROOT, 'src/lib/format.ts')

/** Jalankan formatDateTime di proses baru agar process.env.TZ benar-benar berlaku. */
function formatDateTimeUnderTz(tz: string, iso: string, zone: 'WIB' | 'WITA' | 'WIT') {
  const script = `
    import { formatDateTime } from ${JSON.stringify(FORMAT_MODULE)}
    process.stdout.write(formatDateTime(${JSON.stringify(iso)}, ${JSON.stringify(zone)}))
  `
  return execFileSync(process.execPath, ['--experimental-strip-types', '-e', script], {
    cwd: ROOT,
    env: { ...process.env, TZ: tz },
    encoding: 'utf8',
  }).trim()
}

describe('chartScaleMax', () => {
  it('snaps to even max so mid tick stays linear', () => {
    expect(chartScaleMax(0)).toBe(1)
    expect(chartScaleMax(10)).toBe(10)
    expect(chartScaleMax(11)).toBe(12)
    expect(chartScaleMax(1)).toBe(2)
  })
})

describe('formatNumber', () => {
  it('uses id-ID decimal comma', () => {
    expect(formatNumber(9.2)).toBe('9,2')
  })
})

describe('formatDateTime', () => {
  it('formats WIT (+9) from UTC ISO', () => {
    expect(formatDateTime('2026-10-09T05:05:00.000Z', 'WIT')).toBe(
      '09 Okt 2026, 14:05 WIT',
    )
  })

  it('formats WIB (+7) from offset ISO', () => {
    expect(formatDateTime('2026-10-09T14:05:00+07:00', 'WIB')).toBe(
      '09 Okt 2026, 14:05 WIB',
    )
  })

  it('formats tip pin as date · clock zone', () => {
    expect(formatDateDotTime('2026-10-09T14:05:00+07:00', 'WIB')).toBe(
      '09 Okt 2026 · 14:05 WIB',
    )
  })

  it('is independent of process.env.TZ (Asia/Jakarta vs America/New_York)', () => {
    const iso = '2026-10-09T05:05:00.000Z'
    const jakarta = formatDateTimeUnderTz('Asia/Jakarta', iso, 'WIT')
    const newYork = formatDateTimeUnderTz('America/New_York', iso, 'WIT')
    expect(jakarta).toBe('09 Okt 2026, 14:05 WIT')
    expect(newYork).toBe(jakarta)
  })
})

describe('formatRelativeAge', () => {
  it('uses lowercase menit lalu', () => {
    const now = Date.parse('2026-10-11T12:46:00Z')
    expect(formatRelativeAge('2026-10-11T12:00:00Z', now)).toBe('46 menit lalu')
  })
})
