import { Loader2 } from 'lucide-react'

import { getCopy } from '@/copy'
import { cn } from '@/lib/utils'

/**
 * Satu overlay boot fullscreen — dipasang di AccessGate dari restore sesi
 * sampai framing peta + data regions siap (tanpa remount antar tahap).
 */
export function BootLoading({ className }: { className?: string }) {
  const label = getCopy().common.loading

  return (
    <div
      className={cn(
        'bg-map-bg text-ink fixed inset-0 z-[100] flex flex-col items-center justify-center gap-2',
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
      data-testid="map-soft-loading"
    >
      <Loader2
        className="text-brand size-8 shrink-0 animate-spin"
        strokeWidth={2}
        aria-hidden
      />
      <span className="text-ink-2 text-xs leading-4">{label}</span>
    </div>
  )
}

/** @deprecated pakai BootLoading — alias untuk import lama. */
export const MapSoftLoading = BootLoading
