import { Activity } from 'lucide-react'

import { Skeleton } from '@/components/common'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { copy } from '@/copy/id'
import { useEarthquakes } from '@/data/queries'
import { formatDateTime, formatNumber } from '@/lib/format'

/** Gempa: label · magnitudo · wilayah · meta (waktu / kedalaman / dirasakan). */
export function LatestEarthquakeCard() {
  const { data, isPending, isError } = useEarthquakes('latest')
  const event = data?.data?.[0]

  if (isPending && !data) {
    return (
      <Card aria-busy="true" aria-label={copy.panel.seismicTitle}>
        <CardHeader>
          <Skeleton className="h-4 w-28" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </CardContent>
      </Card>
    )
  }

  if (isError || !event) {
    return (
      <Card aria-label={copy.panel.seismicTitle}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity
              className="panel-icon-quake text-risk-mid size-3.5 shrink-0"
              strokeWidth={2}
              aria-hidden
            />
            {copy.panel.seismicTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-sm leading-5">
            {copy.panel.seismicEmpty}
          </CardDescription>
        </CardContent>
      </Card>
    )
  }

  const magnitude = formatNumber(event.magnitudo)
  const depth = formatNumber(event.kedalaman_km)
  const when = formatDateTime(event.waktu, 'WIB')
  const felt = event.dirasakan?.trim()
  const place = event.wilayah.trim()

  return (
    <Card aria-label={copy.panel.seismicTitle}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity
            className="panel-icon-quake text-risk-mid size-3.5 shrink-0"
            strokeWidth={2}
            aria-hidden
          />
          {copy.panel.seismicTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <p className="text-ink font-mono text-3xl leading-10 font-semibold tabular-nums">
            M {magnitude}
          </p>
          <p className="text-ink text-sm leading-5 break-words">{place}</p>
        </div>
        <div className="text-ink-2 space-y-1 text-xs leading-4">
          <p>{when}</p>
          <p>
            {copy.panel.seismicDepth(depth)}
            {felt ? ` · ${copy.panel.seismicFelt(felt)}` : ''}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
