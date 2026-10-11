import type { MouseEvent, ReactNode } from 'react'

import { focusRing } from '@/components/common/focus-ring'
import { cn } from '@/lib/utils'

type ListRowProps = {
  leading: ReactNode
  title: string
  meta: ReactNode
  trailing?: ReactNode
  active?: boolean
  onClick: (e: MouseEvent<HTMLButtonElement>) => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

/** Shared panel list shell — leading slot is always 40×40. */
export function ListRow({
  leading,
  title,
  meta,
  trailing,
  active = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: ListRowProps) {
  return (
    <button
      type="button"
      className={cn(
        'rounded-card flex min-h-16 w-full items-start gap-3 px-3 py-2 text-left',
        'transition-colors duration-150 ease-in-out',
        focusRing,
        active ? 'bg-surface-muted' : 'hover:bg-surface-muted',
      )}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <span className="flex size-10 shrink-0 items-center justify-center self-center">
        {leading}
      </span>
      <span className="min-w-0 flex-1 py-0.5">
        <span className="text-ink block truncate text-base font-semibold" title={title}>
          {title}
        </span>
        <span className="text-ink-2 mt-0.5 flex flex-col gap-0.5 text-sm">{meta}</span>
      </span>
      {trailing ? <span className="flex shrink-0 self-center">{trailing}</span> : null}
    </button>
  )
}
