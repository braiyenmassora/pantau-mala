import { Info } from 'lucide-react'
import type { KeyboardEvent, MouseEvent } from 'react'

import { Skeleton } from '@/components/common'
import { focusRing } from '@/components/common/focus-ring'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getCopy } from '@/copy'
import { useTotalReports } from '@/data/hotspot-reports'
import { rememberFocusTrigger } from '@/lib/focus-return'
import { formatNumber } from '@/lib/format'
import { T } from '@/lib/pola'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/store/ui'

/** Kartu KPI total laporan warga — klik seluruh kartu (pola Dekat kamu aktif). */
export function TotalReportsCard() {
  const { data: total, isPending } = useTotalReports()
  const setReportsOpen = useUiStore((s) => s.setReportsOpen)
  const setPanelOpen = useUiStore((s) => s.setPanelOpen)
  const tip = getCopy().report.totalInfoTip
  const ask = getCopy().report.totalContributeAsk
  const how = getCopy().report.totalContributeHow

  const open = (el: HTMLElement) => {
    rememberFocusTrigger(el)
    setReportsOpen(true)
    setPanelOpen(true)
  }

  return (
    <Card
      aria-label={getCopy().report.panelTitle}
      aria-description={`${tip} ${ask} ${how}`}
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
      <CardHeader>
        <div className="flex min-w-0 items-center gap-1">
          <CardTitle>{getCopy().report.panelTitle}</CardTitle>
          <span
            className="text-brand inline-flex size-3.5 shrink-0"
            title={tip}
            aria-label={tip}
          >
            <Info className="size-3.5" strokeWidth={1.75} aria-hidden />
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isPending ? (
          <Skeleton className="rounded-ctl h-10 w-24" />
        ) : (
          <p className="text-ink font-mono text-3xl leading-10 font-semibold tabular-nums">
            {formatNumber(total ?? null)}
          </p>
        )}
        <div className={cn(T.quiet, 'space-y-1')}>
          <p>{ask}</p>
          <p>{how}</p>
        </div>
      </CardContent>
    </Card>
  )
}
