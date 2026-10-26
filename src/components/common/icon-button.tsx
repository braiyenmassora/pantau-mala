import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { focusRing } from '@/components/common/focus-ring'
import { T } from '@/lib/pola'
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
        T.icon,
        'hover:bg-surface-muted rounded-ctl flex size-11 shrink-0 items-center justify-center shadow-none transition-colors duration-150',
        focusRing,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

/** Tutup — ikon X saja, tanpa kotak/border. */
export function CloseIconButton(props: IconButtonProps) {
  return <IconButton {...props} />
}
