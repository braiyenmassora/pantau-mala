import { getCopy } from '@/copy'

/**
 * Copy error ramah tanpa jargon teknis — pola Pola Mantap (BE `pola-mantap.tsx`),
 * kalimat muat-ulang disesuaikan FE (tidak selalu ada ikon refresh).
 */
export function friendlyLoadError(
  err: unknown,
  fallback = getCopy().errors.loadFallback,
): string {
  const name = err instanceof Error ? err.name : ''
  const msg = err instanceof Error ? err.message : ''
  if (
    name === 'AbortError' ||
    name === 'TimeoutError' ||
    /timed?\s*out|timeout|signal/i.test(msg)
  ) {
    return getCopy().errors.timeout
  }
  if (/failed to fetch|networkerror|load failed|network/i.test(msg)) {
    return getCopy().errors.network
  }
  return msg.trim() || fallback
}

/** Normalkan pesan gagal aksi (submit, dsb.) jadi kalimat pendek. */
export function friendlyActionError(
  err: unknown,
  fallback = getCopy().errors.actionFallback,
): string {
  const msg = (err instanceof Error ? err.message : '').trim()
  if (
    /layanan akses tidak tersedia|layanan ini belum tersedia|internal.?error/i.test(msg)
  ) {
    return getCopy().errors.serviceNotReady
  }
  if (/akses tidak diizinkan/i.test(msg)) {
    return getCopy().errors.accessDenied
  }
  return friendlyLoadError(err, '') || fallback
}
