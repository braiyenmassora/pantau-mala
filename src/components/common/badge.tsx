import type { ReactNode } from 'react'

import type { RiskCategory } from '@/data/types'
import { RISK_CATEGORIES } from '@/lib/risk-category'
import { cn } from '@/lib/utils'

type BadgeProps =
  | { variant: 'beta'; className?: string; children?: ReactNode }
  | { variant: 'category'; category: RiskCategory; className?: string }

export function Badge(props: BadgeProps) {
  if (props.variant === 'beta') {
    return (
      <span
        className={cn(
          'inline-flex h-6 shrink-0 items-center rounded-full bg-brand-soft px-3 text-xs font-semibold text-brand',
          props.className,
        )}
      >
        {props.children ?? 'Beta'}
      </span>
    )
  }

  const style = RISK_CATEGORIES[props.category]
  return (
    <span
      className={cn(
        'inline-flex h-6 shrink-0 items-center rounded-full px-3 text-xs font-semibold',
        props.className,
      )}
      style={{ backgroundColor: style.tint, color: style.text }}
    >
      {style.label}
    </span>
  )
}
