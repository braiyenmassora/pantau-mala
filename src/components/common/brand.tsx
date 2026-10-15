import { copy } from '@/copy/id'
import { cn } from '@/lib/utils'

type BrandProps = {
  /** Header panel: compact. Beranda Level 3: textOnly. */
  compact?: boolean
  /** Hanya wordmark (tanpa simbol) — Level 3 di panel beranda. */
  textOnly?: boolean
  className?: string
}

/** Brand pantaumala — simbol mata berjaga + wordmark SVG asli (identik CMS backend). */
export function Brand({ compact = false, textOnly = false, className }: BrandProps) {
  if (textOnly) {
    return (
      <img
        src="/brand-wordmark.svg"
        alt={copy.a11y.brand}
        width={108}
        height={20}
        className={cn('h-5 w-auto shrink-0 select-none', className)}
      />
    )
  }

  return (
    <span className={cn('inline-flex items-center gap-2 select-none', className)}>
      <img
        src="/brand-symbol.svg"
        alt=""
        width={compact ? 28 : 36}
        height={compact ? 28 : 36}
        className={compact ? 'size-7 shrink-0' : 'size-9 shrink-0'}
      />
      <img
        src="/brand-wordmark.svg"
        alt={copy.a11y.brand}
        width={compact ? 108 : 152}
        height={compact ? 20 : 28}
        className={compact ? 'h-5 w-auto shrink-0' : 'h-7 w-auto shrink-0'}
      />
    </span>
  )
}
