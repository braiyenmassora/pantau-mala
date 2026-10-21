import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { focusRing } from '@/components/common/focus-ring'
import { cn } from '@/lib/utils'

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
}

/** Tombol ikon-only bersama: target 44px, radius ctl, ghost. Wajib aria-label dari pemanggil. */
export function IconButton({ className, children, ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'text-ink-2 hover:bg-surface-muted hover:text-ink rounded-ctl flex size-11 shrink-0 items-center justify-center transition-colors duration-150',
        focusRing,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
