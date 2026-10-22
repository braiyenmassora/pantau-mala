import { getCopy } from '@/copy'
import type { HotspotReport } from '@/data/hotspot-reports'
import { ReportPhoto } from '@/components/panel/report-photo'
import { formatRelativeAge, reportAuthorInitials } from '@/lib/format'
import { cn } from '@/lib/utils'

type CitizenReportReviewProps = {
  report: HotspotReport
  className?: string
  /** Compact list di panel wilayah; full bila perlu. */
  variant?: 'compact' | 'full'
  onSelect?: (el: HTMLElement) => void
}

/** Baris laporan gaya review Maps — flat, thumb kanan di compact. */
export function CitizenReportReview({
  report,
  className,
  variant = 'full',
  onSelect,
}: CitizenReportReviewProps) {
  const compact = variant === 'compact'

  const textBlock = (
    <div className="min-w-0 flex-1">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-ink truncate text-sm leading-5 font-semibold">
          {report.author_name}
        </p>
        <time
          className="text-ink-2 shrink-0 text-xs leading-4"
          dateTime={report.created_at}
        >
          {formatRelativeAge(report.created_at)}
        </time>
      </div>
      <p className="text-ink-2 mt-1 text-xs leading-4">
        {getCopy().report.sightings[report.sighting]}
      </p>
      {report.description ? (
        <p className={cn('text-ink mt-2 text-sm leading-5', compact && 'line-clamp-2')}>
          {report.description}
        </p>
      ) : null}
    </div>
  )

  const body = compact ? (
    <div className="flex items-start gap-3">
      <span
        className="bg-brand-soft text-brand flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
        aria-hidden
      >
        {reportAuthorInitials(report.author_name)}
      </span>
      {textBlock}
      {report.photo_url ? (
        <ReportPhoto
          src={report.photo_url}
          alt=""
          className="rounded-ctl size-[68px] shrink-0 object-cover"
        />
      ) : null}
    </div>
  ) : (
    <>
      <div className="flex items-start gap-3">
        <span
          className="bg-brand-soft text-brand flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
          aria-hidden
        >
          {reportAuthorInitials(report.author_name)}
        </span>
        {textBlock}
      </div>
      {report.photo_url ? (
        <ReportPhoto
          src={report.photo_url}
          alt={getCopy().report.photoAlt(report.author_name)}
          className="rounded-card mt-3 aspect-[3/2] w-full object-cover"
        />
      ) : null}
    </>
  )

  if (onSelect) {
    return (
      <button
        type="button"
        onClick={(e) => onSelect(e.currentTarget)}
        className={cn(
          'hover:bg-surface-muted rounded-card w-full px-1 py-3 text-left transition-colors',
          className,
        )}
      >
        {body}
      </button>
    )
  }

  return <article className={cn('px-1 py-3', className)}>{body}</article>
}
