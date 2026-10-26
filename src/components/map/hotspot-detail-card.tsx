import { X } from 'lucide-react'

import { CloseIconButton } from '@/components/common'
import { focusRing } from '@/components/common/focus-ring'
import { getCopy } from '@/copy'
import { CHROME, PANEL, T } from '@/lib/pola'
import { cn } from '@/lib/utils'

export type HotspotDetailRow = {
  label: string
  value: string
}

type HotspotDetailCardProps = {
  rows: HotspotDetailRow[]
  onWriteReport?: (el: HTMLElement) => void
  onClose?: () => void
  className?: string
}

/** Tip pin — DNA CHROME.panel; anatomi kartu: label xs · nilai · CTA. */
export function HotspotDetailCard({
  rows,
  onWriteReport,
  onClose,
  className,
}: HotspotDetailCardProps) {
  return (
    <div
      className={cn(
        CHROME.panel,
        'relative w-[min(17.5rem,calc(100vw-2rem))] overflow-hidden',
        className,
      )}
      role="dialog"
      aria-label={getCopy().hotspotDetail.title}
    >
      <div
        className={cn(
          'border-line flex items-center justify-between gap-2 border-b',
          PANEL.pad,
          PANEL.header,
        )}
      >
        <h2 className={cn(T.title, 'min-w-0 truncate')}>
          {getCopy().hotspotDetail.title}
        </h2>
        {onClose ? (
          <CloseIconButton onClick={onClose} aria-label={getCopy().map.closePopup}>
            <X className="size-4 shrink-0" strokeWidth={2} aria-hidden />
          </CloseIconButton>
        ) : null}
      </div>

      <dl className={cn(PANEL.pad, 'flex flex-col gap-2 pt-3 pb-3')}>
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-3">
            <dt className={cn(T.fieldLabel, 'shrink-0')}>{row.label}</dt>
            <dd className={cn(T.body, 'min-w-0 text-right break-words')}>{row.value}</dd>
          </div>
        ))}
      </dl>

      {onWriteReport ? (
        <div className={cn('border-line border-t', PANEL.pad, PANEL.footer)}>
          <button
            type="button"
            className={cn(CHROME.ctaPrimary, 'w-full', focusRing)}
            onClick={(e) => onWriteReport(e.currentTarget)}
          >
            {getCopy().report.panelOpen}
          </button>
        </div>
      ) : null}
    </div>
  )
}
