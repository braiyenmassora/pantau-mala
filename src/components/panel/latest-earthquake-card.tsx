import { Crosshair } from 'lucide-react'

import { Button, Skeleton } from '@/components/common'
import { focusRing } from '@/components/common/focus-ring'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { copy } from '@/copy/id'
import { useEarthquakes } from '@/data/queries'
import { EARTHQUAKE_FEEDS, safeShakemap } from '@/lib/environment-data'
import { formatDateTime, formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

// ponytail: gempa = satu kartu hasil sederhana.
export function LatestEarthquakeCard() {
  const kind = useMapStore((state) => state.earthquakeKind)
  const setKind = useMapStore((state) => state.setEarthquakeKind)
  const focusEarthquake = useMapStore((state) => state.focusEarthquake)
  const setPanelOpen = useUiStore((state) => state.setPanelOpen)
  const { data, isPending, isError } = useEarthquakes(kind)
  const event = data?.data?.[0]

  if (isPending && !data) {
    return (
    <Card role="region" aria-busy="true" aria-label={copy.panel.seismicTitle}>
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
      <Card role="region" aria-label={copy.panel.seismicTitle}>
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
    <Card role="region" aria-label={copy.map.seismicInfo}>
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle>{copy.panel.seismicTitle}</CardTitle>
          <span className="text-ink-3 font-mono text-xs">BMKG</span>
        </div>
        <div className="bg-surface-muted rounded-ctl grid grid-cols-3 gap-1 p-1" role="group" aria-label={copy.map.earthquakeFeedSelect}>
          {EARTHQUAKE_FEEDS.map((feed) => (
            <button key={feed} type="button" aria-pressed={kind === feed} onClick={() => setKind(feed)} className={cn('rounded-ctl min-h-8 px-2 text-xs transition-colors', kind === feed ? 'bg-surface text-brand font-medium shadow-sm' : 'text-ink-2', focusRing)}>
              {feed === 'latest' ? 'Terkini' : feed === 'felt' ? 'Dirasakan' : 'M 5+'}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-ink text-sm leading-5 font-semibold tabular-nums">
          {copy.map.quakeTitle(magnitude)}
        </p>
        <p className="text-ink-2 text-sm leading-5">{event.wilayah}</p>
        <p className="text-ink-3 text-xs leading-5">
          Kedalaman {depth} km
          {footnote ? ` · ${footnote}` : ''}
        </p>
        <p className="text-ink-3 text-xs">Kejadian {formatDateTime(event.waktu, 'WIB')}</p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              focusEarthquake(event)
              if (window.innerWidth < 640) setPanelOpen(false)
            }}
          >
            <Crosshair className="size-3.5" aria-hidden />
            Pusatkan peta
          </Button>
          {event.shakemap && safeShakemap(event.shakemap) && (
            <a
              href={event.shakemap}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand text-xs underline"
            >
              Buka Shakemap ↗
            </a>
          )}
        </div>
        <p className="text-ink-3 text-xs leading-4">
          Data langsung dari feed BMKG; bukan arsip seluruh kejadian atau peringatan dini otomatis.
        </p>
      </CardContent>
    </Card>
  )
}
