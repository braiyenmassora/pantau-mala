import { ArrowUp } from 'lucide-react'

import { focusRing } from '@/components/common/focus-ring'
import { copy } from '@/copy/id'
import type { WindyForecastResponse } from '@/data/extended-contract'
import type { TimeZoneId } from '@/data/types'
import { describeWind, selectWindPoint, windForecastWindow } from '@/lib/environment-data'
import { formatDateTime, formatNumber } from '@/lib/format'
import { useCurrentTime } from '@/lib/use-current-time'
import { cn } from '@/lib/utils'

type WindForecastProps = {
  forecast: WindyForecastResponse
  selectedTime?: number | null
  onSelectTime?: (timestamp: number) => void
  timeZone?: TimeZoneId
}

export function WindForecast({ forecast, selectedTime = null, onSelectTime, timeZone = 'WIB' }: WindForecastProps) {
  const now = useCurrentTime()
  const points = windForecastWindow(forecast.data.titik, now)
  const current = selectWindPoint(points, now, selectedTime)
  const nextDay = points.filter((point) => point.ts >= now && point.ts <= now + 24 * 60 * 60_000)
  const maximum = Math.max(1, ...nextDay.map((point) => point.kecepatan_angin_kmj))
  const wind = current ? describeWind(current.angin_u, current.angin_v) : null
  const keyMode = forecast.data.mode_key ?? 'unverified'
  const keyLabel = keyMode === 'production' ? 'Production' : keyMode === 'testing' ? 'Testing' : 'belum terverifikasi'

  return (
    <section aria-label={copy.map.windForecast} className="space-y-3 text-xs">
      <p className="text-ink-2">
        Windy · {forecast.data.model.toUpperCase()} · {formatNumber(forecast.data.latitude, { maximumFractionDigits: 4 })}, {formatNumber(forecast.data.longitude, { maximumFractionDigits: 4 })}
      </p>
      {current && wind ? (
        <>
          <div className="bg-surface-muted rounded-ctl grid grid-cols-2 gap-2 p-3 sm:grid-cols-4">
            <div>
              <p className="text-ink-2">Kecepatan</p>
              <p className="font-mono text-sm font-semibold">{formatNumber(current.kecepatan_angin_kmj, { maximumFractionDigits: 1 })}</p>
              <p className="text-ink-3">km/jam</p>
            </div>
            <div>
              <p className="text-ink-2">Hembusan</p>
              <p className="font-mono text-sm font-semibold">{formatNumber(current.hembusan_kmj, { maximumFractionDigits: 1 })}</p>
              <p className="text-ink-3">km/jam</p>
            </div>
            <div>
              <p className="text-ink-2">Suhu</p>
              <p className="font-mono text-sm font-semibold">{formatNumber(current.suhu_c, { maximumFractionDigits: 1 })}</p>
              <p className="text-ink-3">°C</p>
            </div>
            <div>
              <p className="text-ink-2">Kelembapan</p>
              <p className="font-mono text-sm font-semibold">{formatNumber(current.kelembapan, { maximumFractionDigits: 0 })}</p>
              <p className="text-ink-3">%</p>
            </div>
          </div>
          <div className="text-ink-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="flex items-center gap-1">
              <ArrowUp className="size-4 text-brand" style={{ transform: `rotate(${wind.toDegrees}deg)` }} aria-hidden />
              Dari {wind.from} {wind.from === 'Tenang' ? '' : `· ${Math.round(wind.fromDegrees)}°`}
            </span>
            <span>Titik embun {current.titik_embun_c == null ? '—' : `${formatNumber(current.titik_embun_c, { maximumFractionDigits: 1 })} °C`}</span>
            <span>Hujan 3j {current.curah_hujan_3j_mm == null ? '—' : `${formatNumber(current.curah_hujan_3j_mm, { maximumFractionDigits: 2 })} mm`}</span>
          </div>
          <p className="text-ink-2">Berlaku {formatDateTime(new Date(current.ts).toISOString(), timeZone)}</p>
        </>
      ) : (
        <p role="status" className="text-ink-2">Tidak ada prakiraan yang masih berlaku untuk waktu ini. Muat ulang atau pilih waktu lain.</p>
      )}
      {nextDay.length > 0 && (
        <div>
          <div className="text-ink-2 mb-2 flex items-center justify-between">
            <span>24 jam berikutnya</span>
            <span>{formatNumber(maximum, { maximumFractionDigits: 1 })} km/jam (puncak)</span>
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1" role="group" aria-label={copy.map.windTimeline}>
            {nextDay.map((point) => {
              const selected = current?.ts === point.ts
              const label = `${formatDateTime(new Date(point.ts).toISOString(), timeZone)}, ${formatNumber(point.kecepatan_angin_kmj)} km/jam`
              const chart = (
                <>
                  <span className="text-ink-2 font-mono text-xs">{formatNumber(point.kecepatan_angin_kmj, { maximumFractionDigits: 0 })}</span>
                  <span className="relative flex h-14 w-full items-end justify-center" aria-hidden>
                    <span className={cn('w-3 rounded-t-ctl', selected ? 'bg-brand' : 'bg-brand/30')} style={{ height: `${point.kecepatan_angin_kmj / maximum * 100}%` }} />
                  </span>
                  <span className="text-ink-3 font-mono text-xs">{formatDateTime(new Date(point.ts).toISOString(), timeZone).split(', ')[1]}</span>
                </>
              )
              return onSelectTime ? (
                <button key={point.ts} type="button" aria-label={label} aria-pressed={selected} onClick={() => onSelectTime(point.ts)} className={cn('rounded-ctl flex min-w-12 flex-1 flex-col items-center gap-1 p-1', selected && 'bg-brand-soft', focusRing)}>{chart}</button>
              ) : (
                <div key={point.ts} title={label} className="flex min-w-12 flex-1 flex-col items-center gap-1 p-1">{chart}</div>
              )
            })}
          </div>
        </div>
      )}
      <p className="text-ink-3 leading-4">Panah menunjukkan arah tujuan angin; label menunjukkan asalnya. Hanya prakiraan titik, bukan medan angin seluruh Indonesia.</p>
      <p className="text-ink-3 leading-4">Key {keyLabel}. Windy adalah prakiraan titik dari model {forecast.data.model.toUpperCase()}, bukan pengukuran langsung.{forecast.data.titik_ditolak ? ` ${forecast.data.titik_ditolak} titik respons tidak dipakai karena tidak lengkap.` : ''}</p>
      <p className="text-ink-3">Respons diterima {formatDateTime(forecast.diambil, timeZone)}; bukan waktu rilis model.</p>
    </section>
  )
}
