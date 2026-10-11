import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type SectionLabelProps = {
  children: ReactNode
  className?: string
  as?: 'h3' | 'p'
}

export function SectionLabel({ children, className, as: Tag = 'h3' }: SectionLabelProps) {
  return (
    <Tag className={cn('text-ink-2 text-sm font-semibold', className)}>{children}</Tag>
  )
}
