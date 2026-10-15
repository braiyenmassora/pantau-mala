import type { ReactNode } from 'react'

import { focusRing } from '@/components/common/focus-ring'
import { cn } from '@/lib/utils'

type InfoRowProps = {
  icon: ReactNode
  /** Caption kecil di atas nilai; kosong = pola Maps satu blok teks. */
  label?: string
  value: ReactNode
  trailing?: ReactNode
  className?: string
  onClick?: () => void
}

/** Baris info Maps: ikon brand kiri, teks, trailing opsional. */
export function InfoRow({
  icon,
  label,
  value,
  trailing,
  className,
  onClick,
}: InfoRowProps) {
  const body = (
    <>
      <span
        className="text-brand mt-0.5 flex size-5 shrink-0 items-center justify-center [&>svg]:size-5"
        aria-hidden
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        {label ? (
          <p className="text-ink-2 text-xs leading-4 font-medium">{label}</p>
        ) : null}
        <div className={cn('text-ink text-sm leading-5', label && 'mt-0.5')}>{value}</div>
      </div>
      {trailing ? <div className="shrink-0 self-center">{trailing}</div> : null}
    </>
  )

  const classes = cn(
    'flex w-full items-start gap-4 py-3 text-left',
    onClick && 'hover:bg-surface-muted -mx-4 cursor-pointer px-4',
    onClick && focusRing,
    className,
  )

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes}>
        {body}
      </button>
    )
  }

  return <div className={classes}>{body}</div>
}
