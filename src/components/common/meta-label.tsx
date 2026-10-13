import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type MetaLabelProps = {
  children: ReactNode
  icon?: ReactNode
  hint?: ReactNode
  className?: string
}

/** Caption row on cards/tiles: ink-2 + xs medium + optional icon/hint. */
export function MetaLabel({ children, icon, hint, className }: MetaLabelProps) {
  return (
    <div className={cn('text-ink-2 flex items-center gap-1', className)}>
      {icon}
      <span className="text-xs font-medium">{children}</span>
      {hint}
    </div>
  )
}
