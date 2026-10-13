import type { ReactNode } from 'react'

import { HintButton } from '@/components/common/hint-button'
import { MetaLabel } from '@/components/common/meta-label'
import { cn } from '@/lib/utils'

type DataTileProps = {
  icon?: ReactNode
  label: string
  value?: string
  unit?: string
  valueClassName?: string
  className?: string
  children?: ReactNode
  hintAria?: string
  hintText?: string
}

export function DataTile({
  icon,
  label,
  value,
  unit,
  valueClassName,
  className,
  children,
  hintAria,
  hintText,
}: DataTileProps) {
  return (
    <div className={cn('rounded-card bg-surface-muted p-3', className)}>
      {(icon || label) && (
        <MetaLabel
          icon={icon}
          hint={
            hintAria && hintText ? (
              <HintButton ariaLabel={hintAria} text={hintText} />
            ) : undefined
          }
        >
          {label}
        </MetaLabel>
      )}
      {children ?? (
        <p
          className={cn(
            'text-ink mt-1 text-base font-semibold tabular-nums',
            valueClassName,
          )}
        >
          {value ?? ''}
          {unit && <span className="text-ink-2 ml-1 text-xs font-normal">{unit}</span>}
        </p>
      )}
    </div>
  )
}
