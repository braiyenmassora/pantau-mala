import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { focusRing } from '@/components/common/focus-ring'
import { cn } from '@/lib/utils'

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** pill = search chrome; square = map controls. */
  shape?: 'pill' | 'square'
  'aria-label': string
  children: ReactNode
}

export function IconButton({
  shape = 'square',
  className,
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'border-line bg-surface text-ink-2 flex size-10 shrink-0 items-center justify-center border shadow-sm',
        'transition-[background-color,color] duration-150 ease-in-out',
        'hover:bg-surface-muted hover:text-ink',
        focusRing,
        shape === 'pill' ? 'rounded-full' : 'rounded-ctl',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
