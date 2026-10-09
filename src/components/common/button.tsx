import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { focusRing } from '@/components/common/focus-ring'
import { cn } from '@/lib/utils'

const variantClass = {
  primary: 'bg-brand text-surface hover:opacity-90',
  secondary: 'border border-line bg-surface text-ink hover:bg-surface-muted',
  soft: 'bg-brand-soft text-brand hover:opacity-90',
} as const

const sizeClass = {
  md: 'h-10 text-base',
  sm: 'h-9 text-sm',
} as const

type AppButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variantClass
  size?: keyof typeof sizeClass
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'sm',
  className,
  children,
  ...props
}: AppButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center rounded-full px-3 font-semibold',
        'transition-[opacity,background-color,color] duration-150 ease-in-out',
        focusRing,
        variantClass[variant],
        sizeClass[size],
        'disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
