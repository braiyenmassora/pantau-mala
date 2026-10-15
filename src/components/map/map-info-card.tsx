import { cn } from '@/lib/utils'

export type MapInfoCardProps = {
  /** Nama kabupaten/kota untuk penanda atau polygon (satu baris, 14/600, tanpa angka) */
  title?: string
  /** Nama kecamatan untuk titik panas individual */
  district?: string
  /** Nama kabupaten/kota untuk titik panas individual */
  regency?: string
  /** Waktu deteksi titik panas, mis. "14.30 WIB" */
  detectedTime?: string
  className?: string
  /** Sembunyikan panah jika diposisikan via popup bawaan */
  hideArrow?: boolean
}

// ponytail: satu komponen kartu info untuk penanda kabupaten & titik panas individual.
export function MapInfoCard({
  title,
  district,
  regency,
  detectedTime,
  className,
  hideArrow = false,
}: MapInfoCardProps) {
  const formattedDistrict = district
    ? district.toLowerCase().startsWith('kecamatan')
      ? district
      : `Kecamatan ${district}`
    : undefined

  const formattedRegency = regency
    ? regency.toLowerCase().startsWith('kab') || regency.toLowerCase().startsWith('kota')
      ? regency
      : `Kabupaten ${regency}`
    : undefined

  const formattedTime = detectedTime
    ? detectedTime.toLowerCase().startsWith('terdeteksi')
      ? detectedTime
      : `Terdeteksi ${detectedTime}`
    : undefined

  return (
    <div
      className={cn(
        'rounded-card border-line bg-surface text-ink relative z-30 max-w-[240px] border px-3 py-2 shadow-sm',
        className,
      )}
    >
      {title ? (
        <p className="text-ink truncate text-sm leading-5 font-semibold">{title}</p>
      ) : (
        <div className="space-y-0.5 text-left">
          {formattedDistrict && (
            <p className="text-ink truncate text-sm leading-5 font-semibold">
              {formattedDistrict}
            </p>
          )}
          {formattedRegency && (
            <p className="text-ink-2 truncate text-xs leading-4">{formattedRegency}</p>
          )}
          {formattedTime && (
            <p className="text-ink-2 truncate text-xs leading-4">{formattedTime}</p>
          )}
        </div>
      )}

      {!hideArrow && (
        <div
          className="border-t-surface pointer-events-none absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-x-[6px] border-t-[6px] border-b-0 border-x-transparent"
          aria-hidden
        />
      )}
    </div>
  )
}
