import type { CSSProperties, ReactNode } from 'react'

import { copy } from '@/copy/id'
import type { RiskCategory } from '@/data/types'
import { RISK_CATEGORIES } from '@/lib/risk-category'
import { cn } from '@/lib/utils'

type BadgeProps =
  | { variant: 'beta'; className?: string; children?: ReactNode }
  | { variant: 'category'; category: RiskCategory; className?: string }

const pad: CSSProperties = { paddingLeft: 10, paddingRight: 10 }

export function Badge(props: BadgeProps) {
  if (props.variant === 'beta') {
    return (
      <span
        style={pad}
        className={cn(
          'inline-flex h-6 shrink-0 items-center rounded-full bg-brand-soft text-xs font-semibold text-brand',
          props.className,
        )}
      >
        {props.children ?? copy.common.beta}
      </span>
    )
  }

  const style = RISK_CATEGORIES[props.category]
  return (
    <span
      style={{ ...pad, backgroundColor: style.tint, color: style.text }}
      className={cn(
        'inline-flex h-6 shrink-0 items-center rounded-full text-xs font-semibold',
        props.className,
      )}
    >
      {style.label}
    </span>
  )
}
