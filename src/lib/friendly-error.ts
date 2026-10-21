/**
 * Copy error ramah tanpa jargon teknis — pola Pola Mantap (BE `pola-mantap.tsx`),
 * kalimat muat-ulang disesuaikan FE (tidak selalu ada ikon refresh).
 */
export function friendlyLoadError(
  err: unknown,
  fallback = 'Data belum dapat dimuat.',
): string {
  const name = err instanceof Error ? err.name : ''
  const msg = err instanceof Error ? err.message : ''
  if (
    name === 'AbortError' ||
    name === 'TimeoutError' ||
    /timed?\s*out|timeout|signal/i.test(msg)
  ) {
    return 'Koneksi terlalu lama. Coba lagi sebentar.'
  }
  if (/failed to fetch|networkerror|load failed|network/i.test(msg)) {
    return 'Tidak terhubung ke server. Coba lagi sebentar.'
  }
  return msg.trim() || fallback
}

/** Normalkan pesan gagal aksi (submit, dsb.) jadi kalimat pendek. */
export function friendlyActionError(
  err: unknown,
  fallback = 'Coba lagi sebentar.',
): string {
  const msg = (err instanceof Error ? err.message : '').trim()
  if (
    /layanan akses tidak tersedia|layanan ini belum tersedia|internal.?error/i.test(
      msg,
    )
  ) {
    return 'Layanan belum siap. Coba lagi sebentar.'
  }
  if (/akses tidak diizinkan/i.test(msg)) {
    return 'Akses tidak diizinkan.'
  }
  return friendlyLoadError(err, '') || fallback
}
