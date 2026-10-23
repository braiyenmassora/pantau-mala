import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { focusRing } from '@/components/common/focus-ring'
import { cn } from '@/lib/utils'

const variantClass = {
  primary: 'bg-brand text-surface hover:opacity-95',
  secondary: 'border-line bg-surface text-ink hover:bg-surface-muted border',
  soft: 'border-brand/20 bg-brand-soft text-brand hover:bg-brand-soft/80 border',
  ghost: 'bg-transparent text-ink-2 hover:bg-surface-muted hover:text-ink',
} as const

/** Tinggi sentuh 44 · text-sm (skala token) / 600. */
const sizeClass = {
  md: 'h-11 min-h-11 px-4 text-sm leading-5 font-semibold',
  sm: 'h-11 min-h-11 px-3 text-sm leading-5 font-semibold',
} as const

type AppButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variantClass
  size?: keyof typeof sizeClass
  loading?: boolean
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'sm',
  loading = false,
  disabled,
  className,
  children,
  ...props
}: AppButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'rounded-card relative inline-flex items-center justify-center gap-2 overflow-hidden shadow-none',
        'transition-[background-color,opacity,transform] duration-150 ease-in-out',
        focusRing,
        variantClass[variant],
        sizeClass[size],
        // Disabled: jangan ikut hover/opacity primary (terasa "aktif" padahal belum siap).
        (disabled || loading) &&
          'pointer-events-none cursor-not-allowed opacity-50 hover:opacity-50',
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" strokeWidth={2} aria-hidden />}
      {children}
    </button>
  )
}
