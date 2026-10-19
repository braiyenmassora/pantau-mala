import { MapPin, X } from 'lucide-react'
import { useEffect, useRef, useSyncExternalStore } from 'react'

import { Button } from '@/components/common'
import { focusRing } from '@/components/common/focus-ring'
import { reportAuthorInitials } from '@/components/panel/citizen-report-review'
import { copy } from '@/copy/id'
import {
  getHotspotReportsSnapshot,
  getReportById,
  subscribeHotspotReports,
} from '@/data/hotspot-reports'
import { rememberFocusTrigger, restoreFocusTrigger } from '@/lib/focus-return'
import { formatRelativeAge } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/store/ui'

/** Side panel detail satu laporan warga (klik dari list). */
export function CitizenReportDetailPanel({ reportId }: { reportId: string }) {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const setSelectedReportId = useUiStore((s) => s.setSelectedReportId)
  const setReportTarget = useUiStore((s) => s.setReportTarget)
  const setPanelOpen = useUiStore((s) => s.setPanelOpen)
  const snap = useSyncExternalStore(subscribeHotspotReports, getHotspotReportsSnapshot)
  void snap

  const report = getReportById(reportId)

  useEffect(() => {
    titleRef.current?.focus()
  }, [reportId])

  const back = () => {
    setSelectedReportId(null)
    restoreFocusTrigger()
  }

  if (!report) {
    return (
      <div className="flex flex-col gap-4 px-4 pt-3 pb-6">
        <button
          type="button"
          onClick={back}
          aria-label={copy.report.detailBack}
          className={cn(
            'text-ink-2 hover:bg-surface-muted rounded-ctl flex size-11 items-center justify-center',
            focusRing,
          )}
        >
          <X className="size-4" strokeWidth={2} aria-hidden />
        </button>
        <p className="text-ink-2 text-sm leading-5">{copy.report.detailNotFound}</p>
      </div>
    )
  }

  const openCompose = (el: HTMLElement) => {
    rememberFocusTrigger(el)
    setReportTarget({
      lat: report.lat,
      lon: report.lon,
      region_code: report.region_code,
      hotspot_time: report.hotspot_time,
    })
    setPanelOpen(true)
  }

  return (
    <div className="flex flex-col">
      <div className="bg-surface sticky top-0 z-10 flex items-center justify-between gap-2 px-4 pt-3 pb-2">
        <h1
          ref={titleRef}
          tabIndex={-1}
          className="text-ink min-w-0 truncate text-sm leading-5 font-semibold outline-none"
        >
          {copy.report.detailTitle}
        </h1>
        <button
          type="button"
          onClick={back}
          aria-label={copy.report.detailBack}
          className={cn(
            'text-ink-2 hover:bg-surface-muted rounded-ctl flex size-11 shrink-0 items-center justify-center transition-colors',
            focusRing,
          )}
        >
          <X className="size-4 shrink-0" strokeWidth={2} aria-hidden />
        </button>
      </div>

      <div className="flex flex-col gap-6 px-4 pt-3 pb-6">
        {report.photo_url ? (
          <img
            src={report.photo_url}
            alt={copy.report.photoAlt(report.author_name)}
            className="aspect-[4/3] w-full rounded-card object-cover"
          />
        ) : null}

        <div className="flex items-start gap-3">
          <span
            className="bg-brand-soft text-brand flex size-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
            aria-hidden
          >
            {reportAuthorInitials(report.author_name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-ink text-base leading-6 font-semibold">
              {report.author_name}
            </p>
            <p className="text-ink-2 mt-0.5 text-xs leading-4">
              {copy.report.sightings[report.sighting]}
              <span aria-hidden> · </span>
              <time dateTime={report.created_at}>
                {formatRelativeAge(report.created_at)}
              </time>
            </p>
          </div>
        </div>

        {report.description ? (
          <p className="text-ink text-sm leading-5 whitespace-pre-wrap">
            {report.description}
          </p>
        ) : null}

        <div className="border-line space-y-2 border-t pt-4">
          <p className="text-ink-2 text-xs leading-4 font-medium">
            {copy.report.detailLocation}
          </p>
          <p className="text-ink flex items-start gap-2 text-sm leading-5">
            <MapPin
              className="text-ink-2 mt-0.5 size-4 shrink-0"
              strokeWidth={2}
              aria-hidden
            />
            <span className="font-mono tabular-nums">
              {copy.report.detailCoords(
                report.point_lat.toFixed(5),
                report.point_lon.toFixed(5),
              )}
            </span>
          </p>
          <p className="text-ink-2 text-xs leading-4">{copy.report.detailMapHint}</p>
          <Button
            variant="soft"
            className="mt-1 w-full shadow-none"
            onClick={(e) => openCompose(e.currentTarget)}
          >
            {copy.report.detailOpenPoint}
          </Button>
        </div>

        <p className="text-ink-2 text-xs leading-4">{copy.report.disclaimer}</p>
      </div>
    </div>
  )
}
