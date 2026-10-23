import { AlertTriangle } from 'lucide-react'

import { useMeta } from '@/data/queries'

const label: Record<'firms' | 'weather' | 'air', string> = {
  firms: 'NASA FIRMS',
  weather: 'Open-Meteo',
  air: 'CAMS',
}

/** A visible, compact warning only when a primary feed is stale or failed. */
export function DataFreshnessNotice() {
  const { data } = useMeta()
  if (!data) return null
  const affected = (Object.entries(data.status) as Array<[keyof typeof label, string]>)
    .filter(([, status]) => status !== 'ok')
    .map(([source]) => label[source])
  if (affected.length === 0) return null

  return (
    <div role="status" className="border-risk-mid/35 bg-risk-mid-tint text-ink rounded-ctl flex items-start gap-2 border px-3 py-2">
      <AlertTriangle className="text-risk-mid mt-1 size-4 shrink-0" aria-hidden />
      <p className="text-xs leading-4">
        Sebagian sumber data terlambat atau belum tersedia: {affected.join(', ')}.
      </p>
    </div>
  )
}
