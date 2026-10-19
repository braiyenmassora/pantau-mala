import { ChevronDown, Waves } from 'lucide-react'
import { useState } from 'react'

import { Button, ProgressBar } from '@/components/common'
import { focusRing } from '@/components/common/focus-ring'
import { Card, CardContent } from '@/components/ui/card'
import { dischargeSchema, historySchema } from '@/data/extended-contract'
import { useOptionalData } from '@/data/queries'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

export function RegionHistoryPanel({ code }: { code: string }) {
  const [open, setOpen] = useState(false)

  return (
    <Card>
      <details onToggle={(event) => setOpen(event.currentTarget.open)}>
        <summary
          className={cn(
            'text-ink hover:bg-surface-muted flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 text-sm font-semibold [&::-webkit-details-marker]:hidden',
            focusRing,
          )}
        >
          <span>Riwayat & debit sungai</span>
          <ChevronDown
            className={cn('size-4 transition-transform', open && 'rotate-180')}
            aria-hidden
          />
        </summary>
        {open ? <RegionHistoryContent code={code} /> : null}
      </details>
    </Card>
  )
}

function RegionHistoryContent({ code }: { code: string }) {
  const history = useOptionalData(
    'region-history',
    `/regions/${encodeURIComponent(code)}/history`,
    (raw) => historySchema.parse(raw).data,
    true,
  )
  const [riverRequested, setRiverRequested] = useState(false)
  const river = useOptionalData(
    'river-discharge',
    `/regions/${encodeURIComponent(code)}/river-discharge`,
    (raw) => dischargeSchema.parse(raw),
    riverRequested,
  )

  return (
    <CardContent className="border-line space-y-4 border-t pt-3">
      <section aria-labelledby={`history-${code}`}>
        <h3 id={`history-${code}`} className="text-ink text-xs font-semibold">
          Riwayat indikator 7 hari
        </h3>
        {history.isPending ? (
          <p role="status" className="text-ink-2 mt-2 text-xs">
            Memuat riwayat…
          </p>
        ) : null}
        {history.isError ? (
          <p role="alert" className="text-ink-2 mt-2 text-xs">
            Riwayat belum dapat dimuat.
          </p>
        ) : null}
        {history.data ? (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <caption className="sr-only">Riwayat indikator tujuh hari</caption>
              <thead className="text-ink-2">
                <tr>
                  <th className="py-2 font-medium">Tanggal</th>
                  <th className="font-medium">Titik panas</th>
                  <th className="font-medium">Skor</th>
                </tr>
              </thead>
              <tbody>
                {history.data.map((point) => (
                  <tr key={point.tanggal} className="border-line border-t">
                    <td className="py-2">{point.tanggal}</td>
                    <td className="font-mono tabular-nums">
                      {formatNumber(point.titik_panas)}
                    </td>
                    <td className="font-mono tabular-nums">{formatNumber(point.skor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <section className="border-line space-y-2 border-t pt-3">
        <div>
          <h3 className="text-ink text-xs font-semibold">Debit sungai model</h3>
          <p className="text-ink-2 mt-1 text-xs leading-4">
            Grid model sekitar pusat wilayah, bukan kejadian atau peringatan banjir.
          </p>
        </div>
        {!riverRequested ? (
          <Button variant="secondary" size="sm" onClick={() => setRiverRequested(true)}>
            Muat prakiraan debit
          </Button>
        ) : null}
        {river.isFetching ? <ProgressBar /> : null}
        {river.isError ? (
          <div className="space-y-2">
            <p role="alert" className="text-ink-2 text-xs">
              Debit sungai belum dapat dimuat.
            </p>
            <Button variant="secondary" size="sm" onClick={() => void river.refetch()}>
              Coba lagi
            </Button>
          </div>
        ) : null}
        {river.data ? (
          <div className="space-y-2">
            <ul className="divide-line divide-y">
              {river.data.data.tanggal_utc.map((day, index) => (
                <li key={day} className="flex items-center gap-2 py-2 text-xs">
                  <Waves className="text-brand size-4 shrink-0" aria-hidden />
                  <span className="text-ink-2 flex-1">{day}</span>
                  <span className="text-ink font-mono font-semibold tabular-nums">
                    {river.data?.data.debit_m3_detik[index] == null
                      ? '—'
                      : `${formatNumber(river.data.data.debit_m3_detik[index])} m³/dtk`}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-ink-3 text-xs leading-4">{river.data.sumber}</p>
          </div>
        ) : null}
      </section>
    </CardContent>
  )
}
