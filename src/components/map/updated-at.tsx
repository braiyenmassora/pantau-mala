import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useMeta } from '@/data/queries'
import type { SourceStatus } from '@/data/types'
import { formatDateTime } from '@/lib/format'
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

  if (isPending || isError || !data) return null

  const problems = problemSources(data.status)
  const hasProblem = problems.length > 0
  const label = `Diperbarui ${formatDateTime(data.diperbarui, 'WIB')}`
  const tip = hasProblem
    ? `Sumber bermasalah: ${problems
        .map((k) => `${SOURCE_LABEL[k]} (${data.status[k]})`)
        .join(', ')}`
    : 'Semua sumber data normal'

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="absolute right-4 bottom-4 z-30 flex h-6 items-center gap-2 text-xs text-ink-2">
          <span
            className={cn(
              'size-2 rounded-full',
              hasProblem ? 'bg-risk-mid' : 'bg-risk-low',
            )}
            aria-hidden
          />
          <span>{label}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="rounded-ctl">
        {tip}
      </TooltipContent>
    </Tooltip>
  )
}
