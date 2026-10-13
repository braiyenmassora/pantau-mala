import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { focusRing } from '@/components/common/focus-ring'
import { cn } from '@/lib/utils'

const variantClass = {
  primary: 'bg-brand text-surface hover:opacity-95 shadow-sm active:translate-y-px',
  secondary: 'border border-line bg-surface text-ink-2 hover:text-ink hover:bg-surface-muted shadow-sm',
  soft: 'border border-brand/20 bg-brand-soft text-brand hover:bg-brand-soft/80 shadow-sm',
} as const

const sizeClass = {
  md: 'h-8 px-3 text-xs',
  sm: 'h-7 px-3 text-xs',
  xs: 'h-6 px-2 text-xs',
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
        'relative inline-flex items-center justify-center gap-2 rounded-ctl font-medium overflow-hidden',
        'transition-[opacity,background-color,color,border-color] duration-150 ease-in-out',
        '[&_svg]:shrink-0',
        focusRing,
        variantClass[variant],
        sizeClass[size],
        (disabled || loading) && 'opacity-60 cursor-not-allowed pointer-events-none',
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />}
      <span>{children}</span>
      {loading && (
        <span
          aria-hidden
          className="bg-brand/30 absolute bottom-0 left-0 h-1 w-full overflow-hidden"
        >
          <span className="bg-brand block h-full w-1/3 animate-indeterminate" />
        </span>
      )}
    </button>
  )
}
