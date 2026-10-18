import { AlertTriangle, CloudOff } from 'lucide-react'

import { EmptyState } from '@/components/common'
import { copy } from '@/copy/id'
import { useMeta } from '@/data/queries'
import { getDataFreshness, type MetaSourceKey } from '@/lib/data-freshness'
import { formatRelativeAge } from '@/lib/format'
import { cn } from '@/lib/utils'

const SOURCE_LABEL: Record<MetaSourceKey, string> = {
  firms: copy.source.firms,
  weather: copy.source.cuaca,
  air: copy.source.udara,
}

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
        title={copy.empty.loadFail.title}
        description={copy.empty.loadFail.description}
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
        title={copy.empty.metaUnavailable.title}
        description={copy.empty.metaUnavailable.description}
      />
    )
  }

  const freshness = getDataFreshness(data)
  if (!freshness.warn) return null

  const relative = freshness.updatedAt
    ? formatRelativeAge(freshness.updatedAt)
    : null

  if (!freshness.updatedAt) {
    return (
      <EmptyState
        icon={AlertTriangle}
        variant="action"
        className={cn(
          'border-risk-mid/40 bg-risk-mid-tint text-risk-mid-text',
          className,
        )}
        title={copy.empty.metaUnavailable.title}
        description={copy.empty.metaUnavailable.description}
      />
    )
  }

  if (freshness.problemSources.length > 0) {
    const list = freshness.problemSources
      .map((k) =>
        copy.updatedAt.sourceStatus(
          SOURCE_LABEL[k],
          copy.updatedAt.statusLabel[data!.status[k]],
        ),
      )
      .join(', ')
    return (
      <EmptyState
        icon={AlertTriangle}
        variant="action"
        className={cn(
          'border-risk-mid/40 bg-risk-mid-tint text-risk-mid-text',
          className,
        )}
        title={copy.empty.dataSourceFail.title}
        description={copy.empty.dataSourceFail.description(list)}
      />
    )
  }

  return (
    <EmptyState
      icon={AlertTriangle}
      variant="action"
      className={cn(
        'border-risk-mid/40 bg-risk-mid-tint text-risk-mid-text',
        className,
      )}
      title={copy.empty.dataStale.title}
      description={copy.empty.dataStale.description(relative!)}
    />
  )
}
