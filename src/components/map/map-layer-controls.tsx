import { Crosshair, Layers2, Radio, RefreshCw, Thermometer, Wind } from 'lucide-react'
import type { ReactNode, RefObject } from 'react'

import { Button } from '@/components/common'
import { copy } from '@/copy/id'
import { focusRing } from '@/components/common/focus-ring'
import { WindForecast } from '@/components/panel/wind-forecast'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { MapRef } from '@/components/ui/map'
import type { Region } from '@/data/types'
import { useWindyWeather } from '@/data/queries'
import { EARTHQUAKE_FEEDS, freshTemperatureRegions } from '@/lib/environment-data'
import { formatNumber } from '@/lib/format'
import { mapOverlayGestureProps } from '@/lib/stop-map-gesture'
import { useCurrentTime } from '@/lib/use-current-time'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'

type Props = { mapRef: RefObject<MapRef | null>; regions: Region[] }

function LayerSwitch({
  icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: ReactNode
  label: string
  description: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <label className="hover:bg-surface-muted rounded-ctl flex cursor-pointer items-center gap-3 px-2 py-2">
      <span className="text-brand shrink-0" aria-hidden>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="text-ink block text-sm font-medium">{label}</span>
        <span className="text-ink-3 block text-xs">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className={cn('accent-brand size-4 shrink-0', focusRing)}
      />
    </label>
  )
}

export function MapLayerControls(props: Props) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={copy.map.layersButton}
          className={cn(
            'border-line bg-surface text-ink-2 hover:bg-surface-muted rounded-card flex size-11 items-center justify-center border shadow-sm',
            focusRing,
          )}
        >
          <Layers2 className="size-5" strokeWidth={1.75} aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="left"
        align="end"
        sideOffset={8}
        className="border-line bg-surface max-h-[min(720px,85dvh)] w-[min(360px,calc(100vw-80px))] overflow-y-auto border p-3 ring-0"
        {...mapOverlayGestureProps}
      >
        <LayerPanel {...props} />
      </PopoverContent>
    </Popover>
  )
}

function LayerPanel({ mapRef, regions }: Props) {
  const showTemperature = useMapStore((state) => state.showTemperature)
  const showWind = useMapStore((state) => state.showWind)
  const showEarthquakes = useMapStore((state) => state.showEarthquakes)
  const toggleTemperature = useMapStore((state) => state.toggleTemperature)
  const toggleWind = useMapStore((state) => state.toggleWind)
  const toggleEarthquakes = useMapStore((state) => state.toggleEarthquakes)
  const kind = useMapStore((state) => state.earthquakeKind)
  const setKind = useMapStore((state) => state.setEarthquakeKind)
  const windLocation = useMapStore((state) => state.windLocation)
  const setWindLocation = useMapStore((state) => state.setWindLocation)
  const windTime = useMapStore((state) => state.windTime)
  const setWindTime = useMapStore((state) => state.setWindTime)
  const selectedCode = useMapStore((state) => state.selectedCode)
  const now = useCurrentTime()
  const valid = freshTemperatureRegions(regions, now)
  const temperatures = valid.map((region) => region.weather.temp_c!)
  const selectedRegion = regions.find((region) => region.code === selectedCode)
  const windy = useWindyWeather(windLocation?.lat, windLocation?.lon, showWind)

  function sampleCenter() {
    const center = mapRef.current?.getCenter()
    if (!center) return
    setWindLocation({
      lon: Number(center.lng.toFixed(4)),
      lat: Number(center.lat.toFixed(4)),
      label: 'Titik tengah peta',
    })
  }

  return (
    <div className="space-y-3">
      <div className="px-2">
        <h2 className="text-ink text-sm font-semibold">Lapisan lingkungan</h2>
        <p className="text-ink-3 mt-1 text-xs">
          Sumber, waktu berlaku, dan cakupan data ditampilkan terpisah.
        </p>
      </div>
      <LayerSwitch
        icon={<Thermometer className="size-4" />}
        label="Suhu udara"
        description="Model Open-Meteo per wilayah"
        checked={showTemperature}
        onChange={toggleTemperature}
      />
      {showTemperature && (
        <div className="bg-surface-muted rounded-ctl space-y-2 p-3 text-xs">
          <p className="text-ink-2">
            {valid.length} dari {regions.length} wilayah memiliki suhu dan waktu data
            valid (maks. 3,5 jam).
          </p>
          {temperatures.length > 0 && (
            <dl className="grid grid-cols-3 gap-2">
              {[
                ['Minimum', Math.min(...temperatures)],
                [
                  'Rata-rata sampel',
                  temperatures.reduce((sum, value) => sum + value, 0) /
                    temperatures.length,
                ],
                ['Maksimum', Math.max(...temperatures)],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-ink-3">{label}</dt>
                  <dd className="font-mono font-semibold">
                    {formatNumber(value as number, { maximumFractionDigits: 1 })}°C
                  </dd>
                </div>
              ))}
            </dl>
          )}
          <p className="text-ink-3">
            Bukan rata-rata nasional, stasiun pengamatan, atau peta suhu kontinu. Klik
            sampel untuk detail.
          </p>
        </div>
      )}
      <LayerSwitch
        icon={<Wind className="size-4" />}
        label="Angin Windy"
        description="Vektor model GFS pada titik pilihan"
        checked={showWind}
        onChange={() => {
          if (!showWind && !windLocation) sampleCenter()
          toggleWind()
        }}
      />
      {showWind && (
        <div className="border-line space-y-3 border-t px-2 pt-3">
          <p className="text-ink-2 text-xs">
            Titik: {windLocation?.label ?? 'Belum dipilih'}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={sampleCenter}>
              <Crosshair className="size-3.5" aria-hidden />
              Tengah peta
            </Button>
            {selectedRegion && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  setWindLocation({
                    lon: selectedRegion.center[0],
                    lat: selectedRegion.center[1],
                    label: selectedRegion.name,
                  })
                }
              >
                Wilayah terpilih
              </Button>
            )}
            {windLocation && (
              <Button
                size="sm"
                variant="secondary"
                aria-label={copy.map.refreshWind}
                loading={windy.isFetching}
                onClick={() => {
                  setWindTime(null)
                  void windy.refetch()
                }}
              >
                <RefreshCw className="size-3.5" aria-hidden />
              </Button>
            )}
          </div>
          {windy.isFetching && (
            <p role="status" className="text-ink-2 text-xs">
              Memuat prakiraan Windy...
            </p>
          )}
          {windy.isError && (
            <p role="alert" className="text-risk-high text-xs">
              Pembaruan Windy gagal.{' '}
              {windy.data
                ? 'Data terakhir tetap ditampilkan dengan waktu berlakunya.'
                : 'Coba lagi; tidak ada arah angin pengganti yang dibuat.'}
            </p>
          )}
          {windy.data && (
            <WindForecast
              forecast={windy.data}
              selectedTime={windTime}
              onSelectTime={setWindTime}
            />
          )}
        </div>
      )}
      <LayerSwitch
        icon={<Radio className="size-4" />}
        label="Gempa bumi"
        description="Feed kejadian resmi BMKG"
        checked={showEarthquakes}
        onChange={toggleEarthquakes}
      />
      {showEarthquakes && (
        <div className="space-y-2 px-2">
          <div
            className="bg-surface-muted rounded-ctl grid grid-cols-3 gap-1 p-1"
            role="group"
            aria-label={copy.map.earthquakeFeedMap}
          >
            {EARTHQUAKE_FEEDS.map((feed) => (
              <button
                type="button"
                key={feed}
                aria-pressed={kind === feed}
                onClick={() => setKind(feed)}
                className={cn(
                  'rounded-ctl min-h-9 px-2 text-xs',
                  kind === feed ? 'bg-surface text-brand font-medium' : 'text-ink-2',
                  focusRing,
                )}
              >
                {feed === 'latest' ? 'Terkini' : feed === 'felt' ? 'Dirasakan' : 'M 5+'}
              </button>
            ))}
          </div>
          <p className="text-ink-3 text-xs">
            Daftar terbatas BMKG, bukan seluruh arsip gempa atau sistem peringatan dini.
          </p>
        </div>
      )}
    </div>
  )
}
