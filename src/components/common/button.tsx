import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { focusRing } from '@/components/common/focus-ring'
import { cn } from '@/lib/utils'

const variantClass = {
  primary: 'bg-brand text-surface hover:opacity-95 shadow-sm active:translate-y-px',
  secondary: 'border border-line bg-surface text-ink hover:bg-surface-muted shadow-sm',
  soft: 'border border-brand/20 bg-brand-soft text-brand hover:bg-brand-soft/80 shadow-sm',
} as const

/** PDF §4: besar 40 (teks 14) · kecil 36 (teks 13) · semua pill · teks 600. */
const sizeClass = {
  md: 'h-10 px-4 text-base font-semibold',
  sm: 'h-9 px-3 text-sm font-semibold',
  xs: 'h-9 px-3 text-sm font-semibold',
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
        'relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full',
        'transition-[background-color,opacity,transform] duration-150 ease-in-out',
        focusRing,
        variantClass[variant],
        sizeClass[size],
        (disabled || loading) && 'cursor-not-allowed opacity-50',
        className,
      )}
      {...props}
    >
      {loading && (
        <Loader2 className="size-4 animate-spin" strokeWidth={2} aria-hidden />
      )}
      {children}
    </button>
  )
}
