import * as React from 'react'
import { cn } from 'cn'
import { Slot } from 'radix-ui'

const variantClass = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/80',
  outline: 'border-border bg-background hover:bg-muted hover:text-foreground border',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  ghost: 'hover:bg-muted hover:text-foreground',
  destructive: 'bg-destructive/10 text-destructive hover:bg-destructive/20',
  link: 'text-primary underline-offset-4 hover:underline',
} as const

const sizeClass = {
  default: 'h-8 gap-1.5 px-2.5',
  xs: 'h-6 gap-1 px-2 text-xs',
  sm: 'h-7 gap-1 px-2.5 text-xs',
  lg: 'h-9 gap-1.5 px-3',
  icon: 'size-8',
  'icon-xs': 'size-6',
  'icon-sm': 'size-7',
  'icon-lg': 'size-9',
} as const

type ButtonProps = React.ComponentProps<'button'> & {
  variant?: keyof typeof variantClass
  size?: keyof typeof sizeClass
  asChild?: boolean
}

/** shadcn Button — pill override via className di pemanggil. */
function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button'

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-lg text-sm font-medium whitespace-nowrap transition-colors outline-none select-none',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3',
        'disabled:pointer-events-none disabled:opacity-50',
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        variantClass[variant],
        sizeClass[size],
        className,
      )}
      {...props}
    />
  )
}

export { Button }
