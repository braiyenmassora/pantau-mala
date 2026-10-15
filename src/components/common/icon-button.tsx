import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { focusRing } from '@/components/common/focus-ring'
import { cn } from '@/lib/utils'

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  'aria-label': string
  children: ReactNode
}

/** Tombol ikon — hit 44, radius/shadow chrome seperti sidebar. */
export function IconButton({ className, children, ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'border-line bg-surface text-ink-2 rounded-ctl shadow-chrome flex size-11 shrink-0 items-center justify-center border',
        'transition-[background-color,color] duration-150 ease-in-out',
        'hover:bg-surface-muted hover:text-ink',
        focusRing,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
