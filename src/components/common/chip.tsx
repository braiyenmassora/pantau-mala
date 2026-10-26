import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { focusRing } from '@/components/common/focus-ring'
import { CHROME } from '@/lib/pola'
import { cn } from '@/lib/utils'

type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  pressed?: boolean
  children: ReactNode
}

/** Chip filter peta — shell CHROME.mapFilterTrigger, tinggi 44. */
export function Chip({ pressed, className, children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={cn(
        CHROME.mapFilterTrigger,
        'inline-flex h-11 min-h-11 items-center gap-2 px-3 text-sm leading-5 font-medium',
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
