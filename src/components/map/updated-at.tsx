import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { copy } from '@/copy/id'
import { isDummyDataMode, useMeta } from '@/data/queries'
import type { SourceStatus } from '@/data/types'
import { formatDateTime } from '@/lib/format'
import { mapOverlayGestureProps } from '@/lib/stop-map-gesture'
import { cn } from '@/lib/utils'

type MetaSources = {
  firms: SourceStatus
  cuaca: SourceStatus
  udara: SourceStatus
}

const SOURCE_LABEL: Record<keyof MetaSources, string> = {
  firms: 'NASA FIRMS',
  cuaca: 'Cuaca',
  udara: 'Kualitas udara',
}

function problemSources(status: MetaSources): (keyof MetaSources)[] {
  return (Object.keys(status) as (keyof MetaSources)[]).filter(
    (k) => status[k] === 'terlambat' || status[k] === 'gagal',
  )
}

export function UpdatedAtBadge() {
  const { data, isPending, isError } = useMeta()
  const dummy = isDummyDataMode()
  const showStamp = !isPending && !isError && !!data

  if (!dummy && !showStamp) return null

  const problems = data ? problemSources(data.status) : []
  const hasProblem = problems.length > 0
  const label = data
    ? `Diperbarui ${formatDateTime(data.diperbarui, 'WIB')}`
    : null
  const tip = hasProblem
    ? `Sumber bermasalah: ${problems
        .map((k) => `${SOURCE_LABEL[k]} (${data!.status[k]})`)
        .join(', ')}`
    : 'Semua sumber data normal'

  return (
    <div
      className="absolute right-4 bottom-4 z-30 flex h-6 items-center gap-2"
      {...mapOverlayGestureProps}
    >
      {dummy && (
        <span
          data-testid="data-sample-pill"
          className="flex h-6 items-center rounded-ctl bg-surface px-2 text-xs text-ink-2 shadow-sm"
        >
          {copy.data.samplePill}
        </span>
      )}
      {showStamp && label && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              data-testid="updated-at"
              aria-label={label}
              className="flex h-6 items-center gap-1 text-xs text-ink-2"
            >
              <span
                className={cn(
                  'size-2 rounded-full',
                  hasProblem ? 'bg-risk-mid' : 'bg-risk-low',
                )}
                aria-hidden
              />
              <span>{label}</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="rounded-ctl">
            {tip}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
