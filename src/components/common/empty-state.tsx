import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/common/button'
import { panelCardClass } from '@/lib/ui-chrome'
import { cn } from '@/lib/utils'

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description: string
  /** info = muted card; action = bordered CTA; bare = content only (dialog). */
  variant?: 'info' | 'action' | 'bare'
  action?: { label: string; onClick: () => void }
  /** Custom action row; wins over `action` when set. */
  actions?: ReactNode
  titleId?: string
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  variant = 'info',
  action,
  actions,
  titleId,
  className,
}: EmptyStateProps) {
  const titleClass = 'text-base font-semibold text-ink'
  const body = (
    <div className="flex items-start gap-3">
      <span className="bg-brand-soft text-brand flex size-10 shrink-0 items-center justify-center rounded-full">
        <Icon className="size-5" strokeWidth={2} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        {titleId ? (
          <h2 id={titleId} className={titleClass}>
            {title}
          </h2>
        ) : (
          <p className={titleClass}>{title}</p>
        )}
        <p className="text-ink-2 mt-1 text-sm">{description}</p>
        {actions ? (
          <div className="mt-3 flex flex-wrap gap-2">{actions}</div>
        ) : (
          action && (
            <Button variant="soft" size="sm" className="mt-3" onClick={action.onClick}>
              {action.label}
            </Button>
          )
        )}
      </div>
    </div>
  )

  if (variant === 'bare') {
    return <div className={className}>{body}</div>
  }

  return (
    <section
      className={cn(
        variant === 'action'
          ? 'rounded-card border-line bg-surface border p-4'
          : panelCardClass,
        className,
      )}
      role="status"
    >
      {body}
    </section>
  )
}
