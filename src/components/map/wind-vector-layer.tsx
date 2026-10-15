import { ArrowUp } from 'lucide-react'
import { useState } from 'react'

import { focusRing } from '@/components/common/focus-ring'
import { MapInfoCard } from '@/components/map/map-info-card'
import { MapMarker, MarkerContent } from '@/components/ui/map'
import { useWindyWeather } from '@/data/queries'
import { describeWind, selectWindPoint } from '@/lib/environment-data'
import { formatDateTime, formatNumber } from '@/lib/format'
import { useCurrentTime } from '@/lib/use-current-time'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'

export function WindVectorLayer() {
  const enabled = useMapStore((state) => state.showWind)
  const location = useMapStore((state) => state.windLocation)
  const selectedTime = useMapStore((state) => state.windTime)
  const { data } = useWindyWeather(location?.lat, location?.lon, enabled)
  const now = useCurrentTime()
  const [inspect, setInspect] = useState(false)
  const point = data ? selectWindPoint(data.data.titik, now, selectedTime) : undefined
  if (!enabled || !location || !point) return null
  const wind = describeWind(point.angin_u, point.angin_v)
  const label = `Windy ${location.label}, ${formatNumber(point.kecepatan_angin_kmj)} km/jam, dari ${wind.from}`
  return (
    <MapMarker longitude={location.lon} latitude={location.lat} anchor="center">
      <MarkerContent className="relative z-20">
        <button type="button" aria-label={label} aria-expanded={inspect} onClick={() => setInspect(!inspect)} className={cn('border-brand/30 bg-surface text-brand rounded-card flex items-center gap-1 border px-2 py-1 shadow-sm', focusRing)}>
          <ArrowUp className="size-5" style={{ transform: `rotate(${wind.toDegrees}deg)` }} aria-hidden />
          <span className="font-mono text-xs">{formatNumber(point.kecepatan_angin_kmj, { maximumFractionDigits: 1 })} km/jam</span>
        </button>
        {inspect && <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2"><MapInfoCard title={location.label} lines={[
          `Windy ${data?.data.model.toUpperCase()} · Prakiraan titik`,
          `Dari ${wind.from} · Hembusan ${formatNumber(point.hembusan_kmj)} km/jam`,
          `Suhu ${formatNumber(point.suhu_c, { maximumFractionDigits: 1 })} °C · RH ${formatNumber(point.kelembapan, { maximumFractionDigits: 0 })}%`,
          `Titik embun ${point.titik_embun_c == null ? '—' : `${formatNumber(point.titik_embun_c, { maximumFractionDigits: 1 })} °C`} · Hujan 3j ${point.curah_hujan_3j_mm == null ? '—' : `${formatNumber(point.curah_hujan_3j_mm, { maximumFractionDigits: 2 })} mm`}`,
          `Berlaku ${formatDateTime(new Date(point.ts).toISOString(), 'WIB')}`,
          'Tier key belum terverifikasi; bukan medan angin nasional.',
        ]} /></div>}
      </MarkerContent>
    </MapMarker>
  )
}
