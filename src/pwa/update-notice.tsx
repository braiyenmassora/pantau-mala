import { RefreshCw } from 'lucide-react'
import { focusRing } from '@/components/common/focus-ring'
import { applyAppUpdate, useAppUpdate } from './updates'
import { copy } from '@/copy/id'

export function AppUpdateNotice() {
  const { available, applying } = useAppUpdate()
  if (!available) return null
  return (
    <aside
      aria-label={copy.app.updateLabel}
      className="border-line bg-surface text-ink fixed right-3 bottom-[calc(env(safe-area-inset-bottom)+12px)] left-3 z-50 flex items-center justify-between gap-3 rounded-lg border px-3 py-2 shadow-sm sm:right-4 sm:left-auto sm:max-w-sm"
    >
      <p className="text-xs" role="status">
        Versi baru tersedia. Muat ulang untuk memperbarui aplikasi.
      </p>
      <button
        type="button"
        disabled={applying}
        onClick={applyAppUpdate}
        className={`bg-brand text-surface inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-md px-3 text-xs font-medium disabled:opacity-60 ${focusRing}`}
      >
        <RefreshCw className="size-3.5" aria-hidden />
        {applying ? 'Memperbarui…' : 'Perbarui'}
      </button>
    </aside>
  )
}
