import { ChevronDown } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { focusRing } from '@/components/common/focus-ring'
import { cn } from '@/lib/utils'

type DetailAccordionProps = {
  title: string
  children: ReactNode
  className?: string
}

/** Accordion panel detail — tertutup default, gaya seragam (Level 3). */
export function DetailAccordion({ title, children, className }: DetailAccordionProps) {
  const [open, setOpen] = useState(false)

  return (
    <details
      className={cn('rounded-card border-line border p-3', className)}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary
        className={cn(
          'text-ink-2 hover:text-ink flex cursor-pointer list-none items-center justify-between gap-2 text-xs font-medium',
          '[&::-webkit-details-marker]:hidden',
          focusRing,
        )}
      >
        <span>{title}</span>
        <ChevronDown
          className={cn(
            'size-3.5 shrink-0 transition-transform duration-150',
            open && 'rotate-180',
          )}
          strokeWidth={2}
          aria-hidden
        />
      </summary>
      {open ? <div className="mt-3 space-y-2">{children}</div> : null}
    </details>
  )
}
