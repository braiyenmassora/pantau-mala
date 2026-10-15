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
import { formatNumber } from '@/lib/format'

// ponytail: gempa = satu kartu hasil sederhana.
export function LatestEarthquakeCard() {
  const { data, isPending, isError } = useEarthquakes('latest')
  const event = data?.data?.[0]

  if (isPending && !data) {
    return (
      <Card aria-busy="true" aria-label={copy.panel.seismicTitle}>
        <CardHeader>
          <Skeleton className="h-4 w-36" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (isError || !event) {
    return (
      <Card aria-label={copy.panel.seismicTitle}>
        <CardHeader>
          <CardTitle>{copy.panel.seismicTitle}</CardTitle>
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
  const footnote = [event.dirasakan, event.potensi].find((s) => s?.trim()) ?? ''

  return (
    <Card aria-label={copy.panel.seismicTitle}>
      <CardHeader>
        <CardTitle>{copy.panel.seismicTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-ink text-sm leading-5 font-semibold tabular-nums">
          {copy.map.quakeTitle(magnitude)}
        </p>
        <p className="text-ink-2 text-sm leading-5">{event.wilayah}</p>
        <p className="text-ink-3 text-xs leading-4">
          Kedalaman {depth} km
          {footnote ? ` · ${footnote}` : ''}
        </p>
      </CardContent>
    </Card>
  )
}
