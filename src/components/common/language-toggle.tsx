import { focusRing } from '@/components/common/focus-ring'
import { useCopy, useLocaleStore, type Locale } from '@/copy'
import { cn } from '@/lib/utils'

const OPTIONS: { locale: Locale; short: string; key: 'indonesian' | 'english' }[] = [
  { locale: 'id', short: 'ID', key: 'indonesian' },
  { locale: 'en', short: 'EN', key: 'english' },
]

/** Toggle bahasa ID | EN — pilihan tersimpan di localStorage. */
export function LanguageToggle() {
  const copy = useCopy()
  const locale = useLocaleStore((s) => s.locale)
  const setLocale = useLocaleStore((s) => s.setLocale)
  return (
    <div
      role="group"
      aria-label={copy.language.label}
      className="border-line rounded-ctl flex shrink-0 overflow-hidden border"
    >
      {OPTIONS.map((opt) => (
        <button
          key={opt.locale}
          type="button"
          aria-pressed={locale === opt.locale}
          aria-label={copy.language[opt.key]}
          onClick={() => setLocale(opt.locale)}
          className={cn(
            'flex h-11 items-center px-3 text-xs leading-4 font-semibold',
            focusRing,
            locale === opt.locale
              ? 'bg-brand text-surface'
              : 'text-ink-2 hover:bg-surface-muted',
          )}
        >
          {opt.short}
        </button>
      ))}
    </div>
  )
}
