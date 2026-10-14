import { Waves } from 'lucide-react'

import { Button, ProgressBar } from '@/components/common'
import { DetailAccordion } from '@/components/panel/detail-accordion'
import { useOptionalData } from '@/data/queries'
import { dischargeSchema } from '@/data/extended-contract'
import { copy } from '@/copy/id'
import { formatNumber } from '@/lib/format'

type RegionRiverPanelProps = {
  code: string
}

/** Debit sungai model — accordion tertutup; data dimuat otomatis saat dibuka. */
export function RegionRiverPanel({ code }: RegionRiverPanelProps) {
  return (
    <DetailAccordion title={copy.extra.river}>
      <RiverBody code={code} />
    </DetailAccordion>
  )
}

function RiverBody({ code }: { code: string }) {
  const river = useOptionalData(
    'river',
    `/regions/${encodeURIComponent(code)}/river-discharge`,
    (raw) => dischargeSchema.parse(raw),
    true,
  )

  return (
    <div className="space-y-2">
      <p className="text-ink-2 text-xs leading-4">{copy.extra.riverNote}</p>
      {river.isFetching && !river.data ? <ProgressBar className="my-1" /> : null}
      {river.isError && (
        <div className="space-y-2">
          <p role="alert" className="text-ink-2 text-xs">
            {copy.extra.unavailable}
          </p>
          <Button
            size="sm"
            variant="secondary"
            loading={river.isFetching}
            onClick={() => void river.refetch()}
          >
            {copy.common.retry}
          </Button>
        </div>
      )}
      {river.data && (
        <>
          <table className="w-full text-left text-xs">
            <caption className="sr-only">{copy.extra.river}</caption>
            <thead>
              <tr className="text-ink-2">
                <th className="py-1.5 font-medium">{copy.extra.dateUtc}</th>
                <th className="py-1.5 font-medium">{copy.extra.discharge}</th>
              </tr>
            </thead>
            <tbody>
              {river.data.data.tanggal_utc.map((day, i) => (
                <tr key={day} className="border-line border-t">
                  <td className="py-1.5 tabular-nums">{day} UTC</td>
                  <td className="py-1.5 tabular-nums">
                    <span className="inline-flex items-center gap-1.5">
                      <Waves
                        className="text-brand size-3.5 shrink-0 animate-water-ripple"
                        strokeWidth={2}
                        aria-hidden
                      />
                      {formatNumber(river.data?.data.debit_m3_detik[i] ?? null)}{' '}
                      m³/detik
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-ink-3 text-xs leading-4">{copy.extra.riverAttribution}</p>
        </>
      )}
    </div>
  )
}
