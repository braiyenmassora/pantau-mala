import { ArrowLeft } from 'lucide-react'
import type { RefObject } from 'react'

import { Brand } from '@/components/common/brand'
import { focusRing } from '@/components/common/focus-ring'
import type { MapRef } from '@/components/ui/map'
import { copy } from '@/copy/id'
import { restoreFocusTrigger } from '@/lib/focus-return'
import { fitIndonesia } from '@/lib/indonesia-view'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

type PanelHeaderPillProps = {
  mapRef: RefObject<MapRef | null>
}

/** Pill atas panel: brand, atau kembali saat detail. Provinsi di FilterBar. */
export function PanelHeaderPill({ mapRef }: PanelHeaderPillProps) {
  const selectedCode = useMapStore((s) => s.selectedCode)
  const select = useMapStore((s) => s.select)
  const panelOpen = useUiStore((s) => s.panelOpen)

  return (
    <div
      className={cn(
        'border-line bg-surface flex h-12 shrink-0 items-center gap-2 rounded-full border px-3 shadow-sm',
      )}
    >
      {selectedCode ? (
        <button
          type="button"
          onClick={() => {
            select(null)
            restoreFocusTrigger()
            const map = mapRef.current
            if (map) fitIndonesia(map, panelOpen, 0)
          }}
          aria-label={copy.panel.closeDetail}
          className={cn(
            'text-ink-2 hover:bg-surface-muted hover:text-ink flex h-9 min-w-0 flex-1 items-center gap-2 rounded-full px-2',
            'transition-colors duration-150',
            focusRing,
          )}
        >
          <ArrowLeft className="size-4 shrink-0" strokeWidth={2} aria-hidden />
          <span className="truncate text-sm font-medium">{copy.panel.backHome}</span>
        </button>
      ) : (
        <Brand textOnly />
      )}
    </div>
  )
}
