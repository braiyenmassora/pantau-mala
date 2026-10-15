import { copy } from '@/copy/id'
import { cn } from '@/lib/utils'

type BrandProps = {
  /** Header panel: compact. Beranda Level 3: textOnly. */
  compact?: boolean
  /** Hanya wordmark teks (tanpa simbol) — Level 3 di panel beranda. */
  textOnly?: boolean
  className?: string
}

/** Wordmark IBM Plex: pantau (hijau) + mala (orange). */
export function Brand({ compact = false, textOnly = false, className }: BrandProps) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-sans', className)}>
      {!textOnly && (
        <img
          src="/brand-symbol.svg"
          alt=""
          width={compact ? 28 : 36}
          height={compact ? 28 : 36}
          className={compact ? 'size-7 shrink-0' : 'size-9 shrink-0'}
        />
      )}
      <span
        className={cn(
          'tracking-tight lowercase',
          textOnly
            ? 'text-xs leading-4 font-medium'
            : compact
              ? 'text-base leading-5 font-semibold'
              : 'text-lg leading-6 font-semibold',
        )}
        aria-label={copy.a11y.brand}
      >
        <span className="text-brand">pantau</span>
        <span className="text-brand-mala">mala</span>
      </span>
    </span>
  )
}
