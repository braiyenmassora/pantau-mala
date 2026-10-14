import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { focusRing } from '@/components/common/focus-ring'
import { cn } from '@/lib/utils'

type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  pressed?: boolean
  children: ReactNode
}

/**
 * Chip kontrol filter compact clean untuk toolbar peta.
 * Setiap chip berdiri sendiri dengan ruang mandiri (independent pill).
 */
export function Chip({ pressed, className, children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={cn(
        'border-line bg-surface inline-flex h-8 items-center gap-1 rounded-full border',
        'text-ink px-3 text-xs font-medium shadow-sm',
        'transition-[background-color,color,border-color] duration-150 ease-in-out',
        'hover:bg-surface-muted [&_svg]:shrink-0',
        focusRing,
        pressed && 'border-ink bg-ink text-surface font-semibold shadow-sm hover:bg-ink hover:text-surface',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
