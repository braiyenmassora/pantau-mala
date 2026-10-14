import type { ElementType, HTMLAttributes, ReactNode } from 'react'

import { panelCardClass } from '@/lib/ui-chrome'
import { cn } from '@/lib/utils'

type PanelCardProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType
  children: ReactNode
}

/** Muted panel card shell — same padding/radius/bg everywhere. */
export function PanelCard({
  as: Tag = 'section',
  className,
  children,
  ...props
}: PanelCardProps) {
  return (
    <Tag className={cn(panelCardClass, className)} {...props}>
      {children}
    </Tag>
  )
}
