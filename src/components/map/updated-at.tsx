import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { copy } from '@/copy/id'
import { useMeta } from '@/data/queries'
import type { SourceStatus } from '@/data/types'
import { formatDateTime, formatRelativeAge, isMetaStale } from '@/lib/format'
import { mapOverlayGestureProps } from '@/lib/stop-map-gesture'
import { cn } from '@/lib/utils'

type MetaStatus = {
  firms: SourceStatus
  weather: SourceStatus
  air: SourceStatus
}

const SOURCE_LABEL: Record<keyof MetaStatus, string> = {
  firms: copy.source.firms,
  weather: copy.source.cuaca,
  air: copy.source.udara,
}

function problemSources(status: MetaStatus): (keyof MetaStatus)[] {
  return (Object.keys(status) as (keyof MetaStatus)[]).filter(
    (k) => status[k] === 'terlambat' || status[k] === 'gagal',
  )
}

export function UpdatedAtBadge() {
  const { data, isPending, isError } = useMeta()
  const showStamp = !isPending && !isError && !!data

  if (!showStamp || !data) return null

  const problems = problemSources(data.status)
  const hasProblem = problems.length > 0
  const stale = isMetaStale(data.updated_at)
  const label = copy.updatedAt.stamp(formatRelativeAge(data.updated_at))
  const tipParts = [
    copy.updatedAt.cadence,
    formatDateTime(data.updated_at, 'WIB'),
    stale ? copy.updatedAt.stale : null,
    hasProblem
      ? copy.updatedAt.problems(
          problems
            .map((k) => copy.updatedAt.sourceStatus(SOURCE_LABEL[k], data.status[k]))
            .join(', '),
        )
      : null,
  ].filter(Boolean)

  return (
    <div
      className="absolute right-4 bottom-4 z-30 flex h-6 items-center gap-2"
      {...mapOverlayGestureProps}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            data-testid="updated-at"
            aria-label={label}
            className="text-ink-2 flex h-6 items-center gap-1 text-xs"
          >
            <span
              className={cn(
                'size-2 rounded-full',
                hasProblem || stale ? 'bg-risk-mid' : 'bg-brand',
              )}
              aria-hidden
            />
            <span>{label}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="rounded-ctl max-w-xs">
          {tipParts.join(' · ')}
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
