import type { ReactNode } from 'react'

import { copy } from '@/copy/id'
import type { ConfidenceLevel } from '@/data/types'
import { chromeSurface } from '@/lib/chrome'
import { cn } from '@/lib/utils'

export type MapInfoCardProps = {
  /** Nama wilayah / judul utama */
  title?: string
  /** Baris sekunder di bawah judul */
  subtitle?: string
  /** Baris tersier */
  meta?: string
  /**
   * Baris tambahan berurutan ke bawah — teks panjang tidak di-trim,
   * tiap string = satu baris.
   */
  lines?: string[]
  /** Nama kecamatan untuk titik panas individual */
  district?: string
  /** Nama kabupaten/kota untuk titik panas individual */
  regency?: string
  /** Waktu deteksi titik panas, mis. "14.30 WIB" */
  detectedTime?: string
  /** Nama satelit/sensor dari API (tampil apa adanya). */
  satellite?: string
  /** Tingkat keyakinan deteksi satelit. */
  confidence?: ConfidenceLevel
  /** Konten tambahan (cuaca flag terpilih, dll.) */
  children?: ReactNode
  className?: string
  /** Sembunyikan panah jika diposisikan via popup bawaan */
  hideArrow?: boolean
}

function InfoLine({ children, strong }: { children: ReactNode; strong?: boolean }) {
  return (
    <p
      className={cn(
        'text-left break-words whitespace-normal',
        strong
          ? 'text-ink text-sm leading-5 font-semibold'
          : 'text-ink-2 text-xs leading-4',
      )}
    >
      {children}
    </p>
  )
}

function push(out: string[], value: string | undefined) {
  if (value) out.push(value)
}

function nonEmpty(value: string | undefined): string | undefined {
  const t = value?.trim()
  return t ? t : undefined
}

// ponytail: flag pin — baris vertikal, teks panjang wrap bukan ellipsis.
export function MapInfoCard({
  title,
  subtitle,
  meta,
  lines,
  district,
  regency,
  detectedTime,
  satellite,
  confidence,
  children,
  className,
  hideArrow = false,
}: MapInfoCardProps) {
  const districtName = nonEmpty(district)
  const regencyName = nonEmpty(regency)
  const timeValue = nonEmpty(detectedTime)
  const satelliteName = nonEmpty(satellite)

  const formattedDistrict = districtName
    ? districtName.toLowerCase().startsWith('kecamatan')
      ? districtName
      : `Kecamatan ${districtName}`
    : undefined

  const formattedRegency = regencyName
    ? regencyName.toLowerCase().startsWith('kab') ||
      regencyName.toLowerCase().startsWith('kota')
      ? regencyName
      : `Kabupaten ${regencyName}`
    : undefined

  const formattedTime = timeValue
    ? timeValue.toLowerCase().startsWith('terdeteksi')
      ? timeValue
      : `Terdeteksi ${timeValue}`
    : undefined

  const formattedSatellite = satelliteName
    ? `${copy.map.satellite}: ${satelliteName}`
    : undefined

  const formattedConfidence =
    confidence && copy.detail.confidence[confidence]
      ? `${copy.map.detectionConfidence}: ${copy.detail.confidence[confidence]}`
      : undefined

  let heading: string | undefined
  const body: string[] = []

  if (title) {
    heading = title
    push(body, subtitle)
    push(body, meta)
    for (const line of lines ?? []) push(body, line)
  } else {
    heading = formattedDistrict ?? formattedRegency
    if (formattedDistrict) push(body, formattedRegency)
    push(body, formattedTime)
    push(body, formattedSatellite)
    push(body, formattedConfidence)
    for (const line of lines ?? []) push(body, line)
    if (!heading && body.length > 0) heading = copy.map.hotspotUntitled
  }

  return (
    <div
      className={cn(
        chromeSurface,
        'relative z-30 w-max max-w-[min(280px,70vw)] px-4 py-3',
        className,
      )}
    >
      {heading || body.length > 0 ? (
        <div className="flex min-w-0 flex-col gap-1 text-left">
          {heading ? <InfoLine strong>{heading}</InfoLine> : null}
          {body.map((line, i) => (
            <InfoLine key={`${i}-${line}`}>{line}</InfoLine>
          ))}
        </div>
      ) : null}

      {children}

      {!hideArrow && (
        <div
          className="border-t-surface pointer-events-none absolute -bottom-1 left-1/2 -translate-x-1/2 border-x-[6px] border-t-[6px] border-b-0 border-x-transparent"
          aria-hidden
        />
      )}
    </div>
  )
}
