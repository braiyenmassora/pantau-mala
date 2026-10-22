import { OutboundLink } from '@/components/common/outbound-link'
import { SectionHead } from '@/components/common/section-head'
import { Card, CardContent } from '@/components/ui/card'
import { getCopy } from '@/copy'
import { OFFICIAL_REFS, POSKO_KARHUTLA, type OfficialRefId } from '@/data/official-refs'
import { cn } from '@/lib/utils'

function refCopy(id: OfficialRefId) {
  return getCopy().official.refs[id]
}

/** Versi ringkas: tautan saja (footer panel). */
export function OfficialRefsCompact({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-1', className)} data-testid="official-refs-compact">
      <p className="text-ink-2 text-xs leading-4 font-medium">
        {getCopy().footer.officialLabel}
      </p>
      <ul className="flex flex-wrap items-center gap-x-1 gap-y-1">
        {OFFICIAL_REFS.map((ref, index) => {
          const { name } = refCopy(ref.id)
          return (
            <li key={ref.id} className="inline-flex items-center gap-1">
              {index > 0 ? (
                <span className="text-ink-3 text-xs leading-4" aria-hidden>
                  ·
                </span>
              ) : null}
              <OutboundLink
                href={ref.href}
                external={ref.external}
                ariaLabel={
                  ref.external
                    ? getCopy().official.openExternal(name)
                    : getCopy().official.callLabel(name)
                }
                className="text-ink-2 hover:text-brand min-h-11 py-1 text-xs leading-4"
                showIcon={ref.external}
              >
                {name}
              </OutboundLink>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** Versi lengkap: blurb per sumber + Posko (kosong sampai data diisi). */
export function OfficialRefsCard() {
  return (
    <Card aria-label={getCopy().official.title} data-testid="official-refs-card">
      <SectionHead title={getCopy().official.title} />
      <CardContent className="space-y-3">
        <p className="text-ink-2 text-xs leading-4">{getCopy().official.differNote}</p>

        <ul className="space-y-3">
          {OFFICIAL_REFS.map((ref) => {
            const { name, blurb } = refCopy(ref.id)
            return (
              <li key={ref.id} className="space-y-1">
                <OutboundLink
                  href={ref.href}
                  external={ref.external}
                  ariaLabel={
                    ref.external
                      ? getCopy().official.openExternal(name)
                      : getCopy().official.callLabel(name)
                  }
                >
                  {name}
                </OutboundLink>
                <p className="text-ink-2 text-xs leading-4">{blurb}</p>
              </li>
            )
          })}

          {POSKO_KARHUTLA.length === 0 ? (
            <li className="space-y-1">
              <p className="text-ink text-sm leading-5 font-medium">
                {getCopy().official.poskoEmptyName}
              </p>
              <p className="text-ink-2 text-xs leading-4">
                {getCopy().official.poskoEmpty}
              </p>
            </li>
          ) : (
            POSKO_KARHUTLA.map((posko) => (
              <li key={posko.id} className="space-y-1">
                <p className="text-ink text-sm leading-5 font-medium">{posko.name}</p>
                <p className="text-ink-2 text-xs leading-4">{posko.province}</p>
                <OutboundLink
                  href={`tel:${posko.phone.replace(/\s+/g, '')}`}
                  external={false}
                  ariaLabel={getCopy().official.poskoPhone(posko.phone)}
                >
                  {posko.phone}
                </OutboundLink>
                {posko.note ? (
                  <p className="text-ink-2 text-xs leading-4">{posko.note}</p>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </CardContent>
    </Card>
  )
}
