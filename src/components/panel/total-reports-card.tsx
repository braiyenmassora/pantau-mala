import type { KeyboardEvent, MouseEvent } from 'react'

import { Skeleton } from '@/components/common'
import { focusRing } from '@/components/common/focus-ring'
import { SectionHead } from '@/components/common/section-head'
import { Card, CardContent } from '@/components/ui/card'
import { copy } from '@/copy/id'
import { useTotalReports } from '@/data/hotspot-reports'
import { rememberFocusTrigger } from '@/lib/focus-return'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/store/ui'

/** Kartu KPI total laporan warga di beranda nasional — klik membuka rincian per wilayah. */
export function TotalReportsCard() {
  const { data: total, isPending } = useTotalReports()
  const setReportsOpen = useUiStore((s) => s.setReportsOpen)
  const setPanelOpen = useUiStore((s) => s.setPanelOpen)

  const open = (el: HTMLElement) => {
    rememberFocusTrigger(el)
    setReportsOpen(true)
    setPanelOpen(true)
  }

  return (
    <Card
      aria-label={copy.report.panelTitle}
      className={cn(
        'hover:bg-surface-muted cursor-pointer transition-colors duration-150',
        focusRing,
      )}
      role="button"
      tabIndex={0}
      onClick={(e: MouseEvent<HTMLElement>) => open(e.currentTarget)}
      onKeyDown={(e: KeyboardEvent<HTMLElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          open(e.currentTarget)
        }
      }}
    >
      <SectionHead title={copy.report.panelTitle} />
      <CardContent className="space-y-1">
        {isPending ? (
          <Skeleton className="rounded-ctl h-10 w-24" />
        ) : (
          <p className="text-ink font-mono text-3xl leading-10 font-semibold tabular-nums">
            {formatNumber(total ?? null)}
          </p>
        )}
        <p className="text-ink text-sm leading-5">{copy.report.totalUnit}</p>
        <p className="text-ink-2 text-xs leading-4">{copy.report.totalOpenHint}</p>
      </CardContent>
    </Card>
  )
}
