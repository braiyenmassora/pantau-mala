import type { HTMLAttributes, ReactNode } from 'react'

import type { RiskCategory } from '@/data/types'
import { RISK_CATEGORIES } from '@/lib/risk-category'
import { cn } from '@/lib/utils'

type BadgeProps =
  | ({ variant: 'meta'; children: ReactNode } & HTMLAttributes<HTMLSpanElement>)
  | ({
      variant: 'category'
      category: RiskCategory
    } & HTMLAttributes<HTMLSpanElement>)

/** Badge kategori — PDF §4: tinggi 24, tint + text. */
const badgeBase =
  'inline-flex h-6 shrink-0 items-center rounded-ctl px-2 text-xs font-semibold'

export function Badge(props: BadgeProps) {
  if (props.variant === 'meta') {
    const { className, children, variant, ...rest } = props
    void variant
    return (
      <span
        className={cn(badgeBase, 'bg-surface text-ink-2 shadow-sm', className)}
        {...rest}
      >
        {children}
      </span>
    )
  }

  const { className, category, variant, ...rest } = props
  void variant
  const style = RISK_CATEGORIES[category]
  return (
    <span
      style={{ backgroundColor: style.tint, color: style.text }}
      className={cn(badgeBase, className)}
      {...rest}
    >
      {style.label}
    </span>
  )
}
