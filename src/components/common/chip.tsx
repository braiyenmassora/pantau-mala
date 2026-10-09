import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { focusRing } from '@/components/common/focus-ring'
import { cn } from '@/lib/utils'

type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  pressed?: boolean
  children: ReactNode
}

export function Chip({ pressed, className, children, style, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      style={{ paddingLeft: 12, paddingRight: 14, ...style }}
      className={cn(
        'inline-flex h-9 items-center gap-2 rounded-full border border-line bg-surface',
        'text-sm font-medium text-ink shadow-sm',
        'transition-[box-shadow,background-color,color,transform] duration-150 ease-in-out',
        'hover:shadow-md [&_svg]:shrink-0',
        focusRing,
        pressed && 'border-ink bg-ink text-surface hover:bg-ink hover:shadow-md',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
