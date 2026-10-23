import { Info } from 'lucide-react'

import { focusRing } from '@/components/common/focus-ring'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { getCopy } from '@/copy'
import { cn } from '@/lib/utils'

type InfoTooltipProps = {
  content: string
  /** Aria singkat (bukan isi tip penuh). */
  label?: string
  className?: string
}

// Ikon 14px; hit area wajib ≥44×44 (className tidak boleh mengecilkan).
export function InfoTooltip({ content, label, className }: InfoTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label ?? getCopy().common.moreInfo}
          className={cn(
            'text-ink-3 hover:text-ink hover:bg-surface-muted rounded-ctl inline-flex shrink-0 items-center justify-center transition-colors',
            focusRing,
            className,
            // Setelah className: cegah override size-4 di caller.
            'size-11 min-h-11 min-w-11',
          )}
        >
          <Info className="size-3.5" strokeWidth={1.75} aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        align="center"
        className="rounded-ctl border-line bg-surface text-ink shadow-chrome max-w-[240px] border p-3 text-xs leading-4"
      >
        {content}
      </TooltipContent>
    </Tooltip>
  )
}
