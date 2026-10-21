import { ArrowLeft } from 'lucide-react'
import type { RefObject } from 'react'

import { focusRing } from '@/components/common/focus-ring'
import { SearchBox } from '@/components/panel/search-box'
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

/** Pill atas panel: search box saat overview, tombol kembali saat detail. */
export function PanelHeaderPill({ mapRef }: PanelHeaderPillProps) {
  const selectedCode = useMapStore((s) => s.selectedCode)
  const select = useMapStore((s) => s.select)
  const province = useMapStore((s) => s.province)
  const setProvince = useMapStore((s) => s.setProvince)
  const panelOpen = useUiStore((s) => s.panelOpen)

  if (selectedCode || province !== 'Semua') {
    return (
      <div className="border-line bg-surface rounded-card shadow-chrome flex h-12 shrink-0 items-center gap-2 border px-3">
        <button
          type="button"
          onClick={() => {
            if (selectedCode) {
              select(null)
            } else {
              setProvince('Semua')
            }
            restoreFocusTrigger()
            const map = mapRef.current
            if (map) fitIndonesia(map, panelOpen, 0)
          }}
          aria-label={copy.panel.closeDetail}
          className={cn(
            'text-ink-2 hover:bg-surface-muted hover:text-ink rounded-ctl flex h-11 min-w-0 flex-1 items-center gap-2 px-2',
            'transition-colors duration-150',
            focusRing,
          )}
        >
          <ArrowLeft className="size-4 shrink-0" strokeWidth={2} aria-hidden />
          <span className="truncate text-sm leading-5 font-medium">
            {selectedCode ? copy.panel.backHome : copy.panel.backIndonesia}
          </span>
        </button>
      </div>
    )
  }

  return <SearchBox mapRef={mapRef} />
}
