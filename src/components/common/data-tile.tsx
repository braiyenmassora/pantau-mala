import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type DataTileProps = {
  icon?: ReactNode
  label: string
  value?: string
  unit?: string
  valueClassName?: string
  className?: string
  children?: ReactNode
}

export function DataTile({
  icon,
  label,
  value,
  unit,
  valueClassName,
  className,
  children,
}: DataTileProps) {
  return (
    <div className={cn('rounded-card bg-surface-muted p-3', className)}>
      {(icon || label) && (
        <div className="flex items-center gap-1 text-ink-2">
          {icon}
          <span className="text-xs font-medium">{label}</span>
        </div>
      )}
      {children ?? (
        <p className={cn('mt-1 text-base font-semibold text-ink', valueClassName)}>
          {value ?? ''}
          {unit && (
            <span className="ml-1 text-xs font-normal text-ink-2">{unit}</span>
          )}
        </p>
      )}
    </div>
  )
}
