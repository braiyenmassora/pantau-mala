import { cn } from '@/lib/utils'

/** Wordmark IBM Plex: pantau (hijau) + mala (orange). */
export function Brand({ compact = false }: { compact?: boolean } = {}) {
  return (
    <span className="inline-flex items-center gap-2 font-sans">
      <img
        src="/brand-symbol.svg"
        alt=""
        width={compact ? 28 : 36}
        height={compact ? 28 : 36}
        className={compact ? 'size-7 shrink-0' : 'size-9 shrink-0'}
      />
      <span
        className={cn(
          'font-semibold tracking-tight lowercase',
          compact ? 'text-base leading-5' : 'text-lg leading-6',
        )}
        aria-label="pantaumala"
      >
        <span className="text-brand">pantau</span>
        <span className="text-brand-mala">mala</span>
      </span>
    </span>
  )
}
