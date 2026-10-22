import { AlertTriangle, CloudOff } from 'lucide-react'

import { EmptyState } from '@/components/common'
import { getCopy } from '@/copy'
import { useMeta } from '@/data/queries'
import { getDataFreshness } from '@/lib/data-freshness'
import { formatRelativeAge } from '@/lib/format'
import { cn } from '@/lib/utils'

type DataFreshnessBannerProps = {
  className?: string
  /** Saat daftar wilayah gagal dimuat — peringatan terpisah dari meta. */
  regionsFailed?: boolean
}

/** Peringatan data usang/gagal — mudah terlihat, bukan tip abu-abu. */
export function DataFreshnessBanner({
  className,
  regionsFailed = false,
}: DataFreshnessBannerProps) {
  const { data, isPending, isError } = useMeta()

  if (regionsFailed) {
    return (
      <EmptyState
        icon={CloudOff}
        variant="action"
        className={cn(
          'border-risk-mid/40 bg-risk-mid-tint text-risk-mid-text',
          className,
        )}
        title={getCopy().empty.loadFail.title}
        description={getCopy().empty.loadFail.description}
      />
    )
  }

  if (isPending) return null

  if (isError) {
    return (
      <EmptyState
        icon={CloudOff}
        variant="action"
        className={cn(
          'border-risk-mid/40 bg-risk-mid-tint text-risk-mid-text',
          className,
        )}
        title={getCopy().empty.metaUnavailable.title}
        description={getCopy().empty.metaUnavailable.description}
      />
    )
  }

  const freshness = getDataFreshness(data)
  if (!freshness.warn) return null

  const relative = freshness.updatedAt ? formatRelativeAge(freshness.updatedAt) : null

  if (!freshness.updatedAt) {
    return (
      <EmptyState
        icon={AlertTriangle}
        variant="action"
        className={cn(
          'border-risk-mid/40 bg-risk-mid-tint text-risk-mid-text',
          className,
        )}
        title={getCopy().empty.metaUnavailable.title}
        description={getCopy().empty.metaUnavailable.description}
      />
    )
  }

  // Sumber gagal: diam saja (tanpa card/snack). Hanya tampilkan bila data usang.
  if (!freshness.stale) return null

  return (
    <EmptyState
      icon={AlertTriangle}
      variant="action"
      className={cn('border-risk-mid/40 bg-risk-mid-tint text-risk-mid-text', className)}
      title={getCopy().empty.dataStale.title}
      description={getCopy().empty.dataStale.description(relative!)}
    />
  )
}
