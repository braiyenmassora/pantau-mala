import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { focusRing } from '@/components/common/focus-ring'
import { cn } from '@/lib/utils'

const variantClass = {
  primary: 'bg-brand text-surface hover:opacity-95 shadow-sm active:translate-y-px',
  secondary: 'border border-line bg-surface text-ink hover:bg-surface-muted shadow-sm',
  soft: 'border border-brand/20 bg-brand-soft text-brand hover:bg-brand-soft/80 shadow-sm',
} as const

const sizeClass = {
  md: 'h-9 px-3 text-sm font-semibold',
  sm: 'h-8 px-3 text-xs font-semibold max-sm:h-9',
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
      className={cn(
        'rounded-ctl relative inline-flex items-center justify-center gap-2 overflow-hidden',
        'transition-[background-color,opacity,transform] duration-150 ease-in-out',
        focusRing,
        variantClass[variant],
        sizeClass[size],
        (disabled || loading) && 'cursor-not-allowed opacity-50',
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" strokeWidth={2} aria-hidden />}
      {children}
    </button>
  )
}
