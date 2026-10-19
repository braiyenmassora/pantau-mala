import { copy } from '@/copy/id'
import type { HotspotReport } from '@/data/hotspot-reports'
import { formatRelativeAge } from '@/lib/format'
import { cn } from '@/lib/utils'

export function reportAuthorInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase()
}

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
      <p className="text-ink-2 mt-0.5 text-xs leading-4">
        {copy.report.sightings[report.sighting]}
      </p>
      {report.description ? (
        <p
          className={cn(
            'text-ink mt-1.5 text-sm leading-5',
            compact && 'line-clamp-2',
          )}
        >
          {report.description}
        </p>
      ) : null}
    </div>
  )

  const body = compact ? (
    <div className="flex items-start gap-3">
      <span
        className="bg-brand-soft text-brand flex size-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
        aria-hidden
      >
        {reportAuthorInitials(report.author_name)}
      </span>
      {textBlock}
      {report.photo_url ? (
        <img
          src={report.photo_url}
          alt=""
          className="size-[72px] shrink-0 rounded-ctl object-cover"
          loading="lazy"
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
        <img
          src={report.photo_url}
          alt={copy.report.photoAlt(report.author_name)}
          className="mt-3 aspect-[3/2] w-full rounded-card object-cover"
          loading="lazy"
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
          'hover:bg-surface-muted w-full rounded-card px-1 py-3 text-left transition-colors',
          className,
        )}
      >
        {body}
      </button>
    )
  }

  return <article className={cn('px-1 py-3', className)}>{body}</article>
}
