import { describe, expect, it } from 'vitest'

import { friendlyActionError, friendlyLoadError } from './friendly-error'

describe('friendly-error', () => {
  it('maps timeout and network failures to plain copy', () => {
    expect(friendlyLoadError(new Error('The operation timed out'))).toBe(
      'Koneksi terlalu lama. Coba lagi sebentar.',
    )
    expect(friendlyLoadError(new TypeError('Failed to fetch'))).toBe(
      'Tidak terhubung ke server. Coba lagi sebentar.',
    )
  })

  it('keeps readable messages and falls back when empty', () => {
    expect(friendlyLoadError(new Error('Data belum dapat dimuat.'))).toBe(
      'Data belum dapat dimuat.',
    )
    expect(friendlyLoadError(new Error(''))).toBe('Data belum dapat dimuat.')
    expect(friendlyLoadError('bukan error')).toBe('Data belum dapat dimuat.')
  })

  it('normalizes coarse server messages for actions', () => {
    expect(friendlyActionError(new Error('Layanan akses tidak tersedia'))).toBe(
      'Layanan belum siap. Coba lagi sebentar.',
    )
    expect(friendlyActionError(new Error('Upload foto gagal. Coba lagi.'))).toBe(
      'Upload foto gagal. Coba lagi.',
    )
  })
})
