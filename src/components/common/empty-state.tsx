import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/common/button'
import { T } from '@/lib/pola'
import { cn } from '@/lib/utils'

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description: string
  /** info/action = kartu lembut; bare = isi saja (dialog). */
  variant?: 'info' | 'action' | 'bare'
  action?: { label: string; onClick: () => void }
  /** Custom action row; wins over `action` when set. */
  actions?: ReactNode
  titleId?: string
  className?: string
}

/** Empty / error / filter-miss — satu pola; CTA selalu Button secondary. */
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
  const body = (
    <div className="flex items-start gap-3">
      <span className="bg-brand-soft text-brand rounded-ctl flex size-8 shrink-0 items-center justify-center">
        <Icon className="size-4" strokeWidth={2} aria-hidden />
      </span>
      <div className="min-w-0 flex-1 space-y-2">
        {titleId ? (
          <h2 id={titleId} className={T.title}>
            {title}
          </h2>
        ) : (
          <p className={T.title}>{title}</p>
        )}
        <p className={T.quiet}>{description}</p>
        {actions ? (
          <div className="flex flex-wrap gap-2 pt-1">{actions}</div>
        ) : (
          action && (
            <Button variant="secondary" size="sm" onClick={action.onClick}>
              {action.label}
            </Button>
          )
        )}
      </div>
    </div>
  )

  if (variant === 'bare') {
    return <div className={cn('text-ink', className)}>{body}</div>
  }

  // info & action: chrome sama (kartu lembut) — beda lewat className pemanggil bila perlu.
  return (
    <section
      className={cn(
        'text-ink rounded-card border-line bg-surface-muted border p-4',
        className,
      )}
      role="status"
    >
      {body}
    </section>
  )
}
