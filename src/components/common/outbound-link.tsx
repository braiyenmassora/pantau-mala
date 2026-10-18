import { ExternalLink, Phone } from 'lucide-react'
import type { ReactNode } from 'react'

import { focusRing } from '@/components/common/focus-ring'
import { cn } from '@/lib/utils'

type OutboundLinkProps = {
  href: string
  /** true = https di tab baru; false = tel/sama tab. */
  external: boolean
  ariaLabel: string
  children: ReactNode
  className?: string
  /** Ikon keluar / telepon di samping teks. */
  showIcon?: boolean
}

/** Tautan keluar atau tel — target sentuh ≥44px, rel aman untuk tab baru. */
export function OutboundLink({
  href,
  external,
  ariaLabel,
  children,
  className,
  showIcon = true,
}: OutboundLinkProps) {
  const Icon = external ? ExternalLink : Phone
  return (
    <a
      href={href}
      {...(external
        ? { target: '_blank', rel: 'noopener noreferrer' }
        : {})}
      aria-label={ariaLabel}
      className={cn(
        'text-brand inline-flex min-h-11 items-center gap-2 py-2 text-sm leading-5 font-medium underline-offset-2 hover:underline',
        focusRing,
        'rounded-ctl',
        className,
      )}
    >
      <span className="min-w-0">{children}</span>
      {showIcon ? (
        <Icon className="size-3.5 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
      ) : null}
    </a>
  )
}
