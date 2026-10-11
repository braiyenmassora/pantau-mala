import { Info } from 'lucide-react'
import type { CSSProperties } from 'react'

import { focusRing } from '@/components/common/focus-ring'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type HintButtonProps = {
  ariaLabel: string
  text: string
  className?: string
  style?: CSSProperties
}

export function HintButton({ ariaLabel, text, className, style }: HintButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            'text-ink-2 hover:text-ink transition-colors duration-150 ease-in-out',
            focusRing,
            'rounded-ctl',
            className,
          )}
          style={style}
          aria-label={ariaLabel}
        >
          <Info className="size-3.5" strokeWidth={2} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="rounded-ctl max-w-xs">
        {text}
      </TooltipContent>
    </Tooltip>
  )
}
