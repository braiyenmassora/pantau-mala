import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { focusRing } from '@/components/common/focus-ring'
import { cn } from '@/lib/utils'

type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  pressed?: boolean
  children: ReactNode
}

/** Chip filter: tinggi 36px, pill, aktif = brand-soft + brand. */
export function Chip({ pressed, className, children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={cn(
        'border-line bg-surface text-ink inline-flex h-9 items-center gap-2 rounded-full border px-3 text-sm font-medium shadow-sm',
        'ease-out-soft transition-[background-color,color,border-color] duration-150',
        'hover:bg-surface-muted [&_svg]:shrink-0',
        focusRing,
        pressed && 'border-brand/30 bg-brand-soft text-brand hover:bg-brand-soft',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
