import { useState } from 'react'
import { ChevronDown, Waves } from 'lucide-react'
import { Button, ProgressBar, SectionLabel } from '@/components/common'
import { useOptionalData } from '@/data/queries'
import { historySchema, dischargeSchema } from '@/data/extended-contract'
import { formatNumber } from '@/lib/format'
import { copy } from '@/copy/id'
import { focusRing } from '@/components/common/focus-ring'
import { cn } from '@/lib/utils'

export function RegionHistoryPanel({ code }: { code: string }) {
  const [open, setOpen] = useState(false)
  return (
    <details
      className="rounded-card border-line border p-3"
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary
        className={cn(
          'text-ink-2 hover:text-ink cursor-pointer list-none font-medium flex items-center justify-between gap-2 text-xs [&::-webkit-details-marker]:hidden',
          focusRing,
        )}
      >
        <span>{copy.extra.historyAndRiver}</span>
        <ChevronDown
          className={cn(
            'size-4 shrink-0 transition-transform duration-200',
            open && 'rotate-180',
          )}
          strokeWidth={2}
          aria-hidden
        />
      </summary>
      {open && <RegionHistoryContent key={code} code={code} />}
    </details>
  )
}

function RegionHistoryContent({ code }: { code: string }) {
  const history = useOptionalData(
    'history',
    `/regions/${encodeURIComponent(code)}/history`,
    (raw) => historySchema.parse(raw).data,
    true,
  )
  const [requested, setRequested] = useState(true)
  const river = useOptionalData(
    'river',
    `/regions/${encodeURIComponent(code)}/river-discharge`,
    (raw) => dischargeSchema.parse(raw),
    requested,
  )
  return (
    <div className="mt-4 space-y-4">
      <section className="space-y-2">
        <SectionLabel>{copy.extra.history}</SectionLabel>
        {history.isPending && (
          <p role="status" className="text-xs">
            {copy.common.loading}
          </p>
        )}
        {history.isError && (
          <p role="alert" className="text-xs">
            {copy.extra.unavailable}
          </p>
        )}
        {history.data && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <caption className="sr-only">{copy.extra.history}</caption>
              <thead>
                <tr>
                  <th className="py-2">{copy.extra.date}</th>
                  <th>{copy.extra.detections}</th>
                  <th>{copy.extra.score}</th>
                </tr>
              </thead>
              <tbody>
                {history.data.map((point) => (
                  <tr key={point.tanggal} className="border-line border-t">
                    <td className="py-2">{point.tanggal}</td>
                    <td>{formatNumber(point.titik_panas)}</td>
                    <td>{formatNumber(point.skor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className="space-y-2">
        <SectionLabel>{copy.extra.river}</SectionLabel>
        <p className="text-ink-2 text-xs">{copy.extra.riverNote}</p>
        {river.isFetching && <ProgressBar className="my-2" />}
        <Button
          size="sm"
          variant="primary"
          loading={river.isFetching}
          onClick={() => {
            setRequested(true)
            if (requested) void river.refetch()
          }}
        >
          {copy.extra.loadRiver}
        </Button>
        {river.isError && (
          <p role="alert" className="text-xs">
            {copy.extra.unavailable}
          </p>
        )}
        {river.data && (
          <>
            <p className="text-ink-2 text-xs">{river.data.keterangan}</p>
            <p className="text-xs">{river.data.sumber}</p>
            <ul className="space-y-1 text-xs">
              {river.data.data.tanggal_utc.map((day, i) => (
                <li key={day} className="flex items-center gap-2 py-1">
                  <Waves className="size-4 shrink-0 text-brand animate-water-ripple" strokeWidth={2} aria-hidden />
                  <span>{day} · {formatNumber(river.data?.data.debit_m3_detik[i] ?? null)} m³/detik</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  )
}
