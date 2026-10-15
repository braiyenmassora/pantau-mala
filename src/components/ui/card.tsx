import * as React from 'react'
import { cn } from 'cn'

/** Kartu hasil sidebar — border tipis, radius token, tanpa bayangan tebal. */
function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card"
      className={cn(
        'border-line bg-surface text-ink rounded-card flex flex-col border',
        className,
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn('flex flex-col gap-2 px-4 pt-4', className)}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-title"
      className={cn('text-ink text-sm leading-5 font-semibold', className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-description"
      className={cn('text-ink-2 text-xs leading-5', className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-content"
      className={cn('px-4 pt-2.5 pb-4', className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn('border-line flex items-center border-t px-4 py-3', className)}
      {...props}
    />
  )
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
