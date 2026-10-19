import { Mountain, Waves } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { copy } from '@/copy/id'
import { useSoilMoisture } from '@/data/queries'
import { focusRing } from '@/components/common/focus-ring'
import type { SoilMoistureResponse } from '@/data/extended-contract'
import { formatDateTime, formatNumber } from '@/lib/format'
import type { TimeZoneId } from '@/data/types'
import { useCurrentTime } from '@/lib/use-current-time'

type TerrainIndicatorCardProps = {
  data: SoilMoistureResponse
  timeZone: TimeZoneId
}

function percent(value: number | null | undefined): string {
  return value == null
    ? '—'
    : `${formatNumber(value * 100, { maximumFractionDigits: 1 })}%`
}

export function TerrainIndicatorCard({ data, timeZone }: TerrainIndicatorCardProps) {
  const indicator = data.data
  const validAt = indicator.provenans.waktu_valid ?? indicator.waktu_model
  const now = useCurrentTime()
  const expires = indicator.provenans.berlaku_hingga
  const stale =
    indicator.provenans.status === 'stale' ||
    (expires != null && Date.parse(expires) <= now)

  return (
    <Card
      role="region"
      aria-label={copy.extra.terrainRegionLabel}
      className="bg-surface-muted border-0"
    >
      <CardHeader>
        <CardTitle>{copy.extra.terrainTitle}</CardTitle>
        <p className="text-ink-2 text-xs leading-5">
          {copy.extra.terrainModelSource(data.sumber)}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {stale ? (
          <p className="text-ink-2 text-xs leading-5">{copy.extra.terrainStale}</p>
        ) : null}
        {indicator.provenans.status === 'unavailable' ? (
          <p className="text-ink-2 text-xs leading-5">{copy.extra.terrainUnavailable}</p>
        ) : null}
        <div className="grid grid-cols-3 gap-3">
          <div className="min-w-0">
            <div className="text-ink-2 flex items-center gap-1 text-xs">
              <Waves className="size-3.5" strokeWidth={1.8} aria-hidden />
              <span>{copy.extra.terrainSurface}</span>
            </div>
            <p className="text-ink mt-1 text-sm font-semibold tabular-nums">
              {percent(indicator.kelembapan_tanah_0_1cm_m3m3)}
            </p>
          </div>
          <div className="min-w-0">
            <div className="text-ink-2 flex items-center gap-1 text-xs">
              <Waves className="size-3.5" strokeWidth={1.8} aria-hidden />
              <span>{copy.extra.terrainRoot}</span>
            </div>
            <p className="text-ink mt-1 text-sm font-semibold tabular-nums">
              {percent(indicator.kelembapan_tanah_3_9cm_m3m3)}
            </p>
          </div>
          <div className="min-w-0">
            <div className="text-ink-2 flex items-center gap-1 text-xs">
              <Mountain className="size-3.5" strokeWidth={1.8} aria-hidden />
              <span>{copy.extra.terrainElevation}</span>
            </div>
            <p className="text-ink mt-1 text-sm font-semibold tabular-nums">
              {indicator.elevasi_mdpl == null
                ? '—'
                : `${formatNumber(indicator.elevasi_mdpl, { maximumFractionDigits: 0 })} m`}
            </p>
          </div>
        </div>
        <p className="text-ink-2 text-xs leading-5">{copy.extra.terrainGrid}</p>
        <p className="text-ink-3 text-xs leading-4">{copy.extra.terrainDisclaimer}</p>
        <p className="text-ink-3 text-xs leading-4">
          {copy.extra.terrainValid} {validAt ? formatDateTime(validAt, timeZone) : '—'} ·{' '}
          {copy.extra.terrainFetched}{' '}
          {formatDateTime(indicator.provenans.waktu_tarik, timeZone)}
        </p>
      </CardContent>
    </Card>
  )
}

export function RegionTerrainCard({
  center,
  timeZone,
}: {
  center: readonly [number, number]
  timeZone: TimeZoneId
}) {
  const soil = useSoilMoisture(center[1], center[0])
  if (soil.data) return <TerrainIndicatorCard data={soil.data} timeZone={timeZone} />
  return (
    <Card
      role="region"
      aria-label={copy.extra.terrainRegionLabel}
      aria-busy={soil.isFetching}
      className="bg-surface-muted border-0"
    >
      <CardHeader>
        <CardTitle>{copy.extra.terrainTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-ink-2 text-xs leading-5">
          {soil.isFetching ? copy.extra.terrainLoading : copy.extra.terrainUnavailable}
        </p>
        {soil.isError ? (
          <button
            type="button"
            onClick={() => void soil.refetch()}
            className={`text-brand rounded-ctl min-h-9 px-2 text-xs font-medium ${focusRing}`}
            disabled={soil.isFetching}
          >
            {copy.common.retry}
          </button>
        ) : null}
      </CardContent>
    </Card>
  )
}
