import { Info, X } from 'lucide-react'
import { useEffect } from 'react'

import { focusRing } from '@/components/common/focus-ring'
import { getCopy } from '@/copy'
import { CHROME } from '@/lib/pola'
import { cn } from '@/lib/utils'
import { useToastStore } from '@/store/toast'

/** Toast global kanan atas — pola sama dengan web api-pantau-mala: ikon Info merah untuk error. */
export function Toast() {
  const title = useToastStore((s) => s.title)
  const description = useToastStore((s) => s.description)
  const tone = useToastStore((s) => s.tone)
  const dismissToast = useToastStore((s) => s.dismissToast)

  useEffect(() => {
    if (!title) return
    const timer = setTimeout(dismissToast, 3200)
    return () => clearTimeout(timer)
  }, [title, dismissToast])

  if (!title) return null

  return (
    <div
      className="pointer-events-none fixed top-4 right-4 z-50 flex w-full max-w-xs flex-col items-end gap-2"
      aria-live="polite"
    >
      <div
        role={tone === 'err' ? 'alert' : 'status'}
        className={cn(CHROME.popup, 'pointer-events-auto w-full px-3 py-2')}
      >
        <div className="flex items-start gap-2">
          <Info
            className={cn(
              'mt-1 size-4 shrink-0',
              tone === 'err' ? 'text-risk-high' : 'text-brand',
            )}
            strokeWidth={2}
            aria-hidden
          />
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-ink text-xs leading-4 font-semibold">{title}</p>
            {description ? (
              <p className="text-ink-2 text-xs leading-4">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={dismissToast}
            aria-label={getCopy().common.dismissNotification}
            className={cn(
              'text-brand hover:bg-surface-muted rounded-ctl inline-flex size-8 shrink-0 items-center justify-center transition-colors',
              focusRing,
            )}
          >
            <X className="size-3.5" strokeWidth={2} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  )
}
