import { MapPin, X } from 'lucide-react'
import { useEffect, useRef } from 'react'

import { CloseIconButton } from '@/components/common/icon-button'
import { SectionHead } from '@/components/common/section-head'
import { CitizenReportReview } from '@/components/panel/citizen-report-review'
import { Card, CardContent } from '@/components/ui/card'
import { getCopy } from '@/copy'
import { useHotspotReport } from '@/data/hotspot-reports'
import { restoreFocusTrigger } from '@/lib/focus-return'
import { PANEL, T } from '@/lib/pola'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/store/ui'

/** Side panel detail satu laporan warga (klik dari list). */
export function CitizenReportDetailPanel({ reportId }: { reportId: string }) {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const setSelectedReportId = useUiStore((s) => s.setSelectedReportId)
  const { data: report, isPending } = useHotspotReport(reportId)

  useEffect(() => {
    titleRef.current?.focus()
  }, [reportId])

  const back = () => {
    setSelectedReportId(null)
    restoreFocusTrigger()
  }

  if (!report) {
    return (
      <div className="flex flex-col">
        <div
          className={cn(
            PANEL.stickyHeader,
            PANEL.pad,
            PANEL.header,
            'flex items-center justify-between gap-2',
          )}
        >
          <h1 className={cn(T.title, 'min-w-0 truncate')}>
            {getCopy().report.detailTitle}
          </h1>
          <CloseIconButton onClick={back} aria-label={getCopy().report.detailBack}>
            <X className="size-4 shrink-0" strokeWidth={2} aria-hidden />
          </CloseIconButton>
        </div>
        <div className={cn(PANEL.body, PANEL.pad)}>
          <p className={T.quiet}>
            {isPending ? getCopy().common.loading : getCopy().report.detailNotFound}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <div
        className={cn(
          PANEL.stickyHeader,
          PANEL.pad,
          PANEL.header,
          'flex items-center justify-between gap-2',
        )}
      >
        <h1
          ref={titleRef}
          tabIndex={-1}
          className={cn(T.title, 'min-w-0 truncate outline-none')}
        >
          {getCopy().report.detailTitle}
        </h1>
        <CloseIconButton onClick={back} aria-label={getCopy().report.detailBack}>
          <X className="size-4 shrink-0" strokeWidth={2} aria-hidden />
        </CloseIconButton>
      </div>

      <div className={cn(PANEL.body, PANEL.pad)}>
        <CitizenReportReview report={report} variant="full" />

        <Card aria-label={getCopy().report.detailLocation}>
          <SectionHead title={getCopy().report.detailLocation} />
          <CardContent className="space-y-3">
            <p className={cn(T.body, 'flex items-start gap-2')}>
              <MapPin
                className="text-brand mt-1 size-4 shrink-0"
                strokeWidth={2}
                aria-hidden
              />
              <span className="min-w-0 font-mono break-all tabular-nums">
                {getCopy().report.detailCoords(
                  report.point_lat.toFixed(5),
                  report.point_lon.toFixed(5),
                )}
              </span>
            </p>
            <div className={cn(T.quiet, 'space-y-2')}>
              <p>{getCopy().report.detailMapHint}</p>
              <p>{getCopy().report.panelHint}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
