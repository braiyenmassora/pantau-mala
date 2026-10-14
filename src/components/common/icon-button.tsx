import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { focusRing } from '@/components/common/focus-ring'
import { cn } from '@/lib/utils'

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  'aria-label': string
  children: ReactNode
}

/** Tombol ikon peta — PDF: 40×40, pill. */
export function IconButton({ className, children, ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'border-line bg-surface text-ink-2 flex size-10 shrink-0 items-center justify-center rounded-full border shadow-sm',
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
