import * as React from 'react'
import { cn } from 'cn'

/** shadcn Input — border/ring bisa di-override (mis. search pill transparan). */
function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'border-input placeholder:text-muted-foreground rounded-ctl h-8 w-full min-w-0 border bg-transparent px-2.5 py-1 text-sm transition-colors outline-none',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
