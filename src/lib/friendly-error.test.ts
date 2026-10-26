import { describe, expect, it } from 'vitest'

import { friendlyActionError, friendlyLoadError } from './friendly-error'

describe('friendly-error', () => {
  it('maps timeout and network failures to plain copy', () => {
    expect(friendlyLoadError(new Error('The operation timed out'))).toBe(
      'Koneksi terlalu lama. Coba lagi.',
    )
    expect(friendlyLoadError(new TypeError('Failed to fetch'))).toBe(
      'Tidak terhubung ke server. Coba lagi.',
    )
  })

  it('keeps readable messages and falls back when empty', () => {
    expect(friendlyLoadError(new Error('Data belum termuat.'))).toBe(
      'Data belum termuat.',
    )
    expect(friendlyLoadError(new Error(''))).toBe('Data belum termuat.')
    expect(friendlyLoadError('bukan error')).toBe('Data belum termuat.')
  })

  it('normalizes coarse server messages for actions', () => {
    expect(friendlyActionError(new Error('Layanan akses tidak tersedia'))).toBe(
      'Layanan belum siap. Coba lagi.',
    )
    expect(friendlyActionError(new Error('Foto gagal diunggah. Coba lagi.'))).toBe(
      'Foto gagal diunggah. Coba lagi.',
    )
  })
})
