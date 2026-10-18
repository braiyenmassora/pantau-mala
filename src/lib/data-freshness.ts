import type { Meta, SourceStatus } from '@/data/types'
import { isMetaStale } from '@/lib/format'

export type MetaSourceKey = 'firms' | 'weather' | 'air'

export type DataFreshness = {
  /** Tampilkan peringatan yang mudah terlihat. */
  warn: boolean
  stale: boolean
  /** Sumber terlambat atau gagal. */
  problemSources: MetaSourceKey[]
  updatedAt: string | null
}

function isProblem(status: SourceStatus): boolean {
  return status === 'terlambat' || status === 'gagal'
}

/** Status pembaruan meta untuk banner/stempel — tanpa UI. */
export function getDataFreshness(
  meta: Meta | null | undefined,
  nowMs: number = Date.now(),
): DataFreshness {
  if (!meta) {
    return { warn: false, stale: false, problemSources: [], updatedAt: null }
  }

  const problemSources = (Object.keys(meta.status) as MetaSourceKey[]).filter((k) =>
    isProblem(meta.status[k]),
  )
  const updatedAt = meta.updated_at
  const stale = updatedAt ? isMetaStale(updatedAt, nowMs) : false
  const warn = stale || problemSources.length > 0 || !updatedAt

  return { warn, stale, problemSources, updatedAt }
}
