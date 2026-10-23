import { focusRing } from '@/components/common/focus-ring'
import { useCopy, useLocaleStore, type Locale } from '@/copy'
import { cn } from '@/lib/utils'

const OPTIONS: {
  locale: Locale
  key: 'indonesian' | 'english'
  src: string
}[] = [
  { locale: 'id', key: 'indonesian', src: '/flags/id.svg' },
  { locale: 'en', key: 'english', src: '/flags/en.svg' },
]

/** Toggle bahasa lewat bendera SVG — label teks tetap di aria. */
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
            // 44×44: sama target sentuh IconButton / kontrol utama.
            'flex size-11 items-center justify-center',
            focusRing,
            locale === opt.locale ? 'bg-brand-soft' : 'hover:bg-surface-muted',
          )}
        >
          <img
            src={opt.src}
            alt=""
            width={18}
            height={12}
            className="border-line rounded-ctl h-3 w-5 border object-cover"
            decoding="async"
            draggable={false}
          />
        </button>
      ))}
    </div>
  )
}
