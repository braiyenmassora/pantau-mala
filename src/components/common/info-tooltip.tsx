import { Info } from 'lucide-react'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type InfoTooltipProps = {
  content: string
  className?: string
}

// ponytail: ikon info 14px abu-abu, area klik 24px, tooltip max 240px teks 12px.
export function InfoTooltip({ content, className }: InfoTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={content}
          className={cn(
            'text-ink-3 hover:text-ink hover:bg-surface-muted inline-flex size-6 shrink-0 items-center justify-center rounded-full transition-colors',
            className,
          )}
        >
          <Info className="size-3.5" strokeWidth={1.75} aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        align="center"
        className="rounded-card border-line bg-surface text-ink max-w-[240px] border p-3 text-xs leading-4 shadow-sm"
      >
        {content}
      </TooltipContent>
    </Tooltip>
  )
}
