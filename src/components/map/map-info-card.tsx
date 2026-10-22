import type { ReactNode } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { getCopy } from '@/copy'
import { cn } from '@/lib/utils'

export type MapInfoCardProps = {
  /** Nama wilayah / judul utama */
  title?: string
  /** Baris sekunder di bawah judul */
  subtitle?: string
  /** Baris tersier — biasanya jumlah titik panas */
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
  /**
   * Waktu pembaruan/deteksi — pola "09 Okt 2026 · 14:05 WIB"
   * (pakai formatDateDotTime).
   */
  updatedAt?: string
  /** Konten tambahan */
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

/** Tanggal · jam — titik di tengah sebagai pemisah visual. */
function UpdatedAtLine({ value }: { value: string }) {
  const parts = value.split(' · ')
  if (parts.length !== 2) {
    return <InfoLine>{value}</InfoLine>
  }
  return (
    <p className="text-ink-2 flex items-center gap-2 text-left text-xs leading-4">
      <span>{parts[0]}</span>
      <span className="bg-ink-3 size-1 shrink-0 rounded-full" aria-hidden />
      <span>{parts[1]}</span>
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

/** Tip pin peta: lokasi · jumlah titik · tanggal · jam (tanpa satelit). */
export function MapInfoCard({
  title,
  subtitle,
  meta,
  lines,
  district,
  regency,
  updatedAt,
  children,
  className,
  hideArrow = false,
}: MapInfoCardProps) {
  const districtName = nonEmpty(district)
  const regencyName = nonEmpty(regency)
  const updated = nonEmpty(updatedAt)

  const formattedDistrict = districtName
    ? districtName.toLowerCase().startsWith('kecamatan')
      ? districtName
      : getCopy().map.districtName(districtName)
    : undefined

  const formattedRegency = regencyName
    ? regencyName.toLowerCase().startsWith('kab') ||
      regencyName.toLowerCase().startsWith('kota')
      ? regencyName
      : getCopy().map.regencyName(regencyName)
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
    push(body, meta)
    for (const line of lines ?? []) push(body, line)
    if (!heading && (body.length > 0 || updated)) heading = getCopy().map.hotspotUntitled
  }

  return (
    <Card
      className={cn(
        'shadow-chrome relative z-30 w-max max-w-[min(280px,70vw)]',
        className,
      )}
    >
      <CardContent className="space-y-1 pt-3">
        {heading || body.length > 0 || updated ? (
          <div className="flex min-w-0 flex-col gap-1 text-left">
            {heading ? <InfoLine strong>{heading}</InfoLine> : null}
            {body.map((line, i) => (
              <InfoLine key={`${i}-${line}`}>{line}</InfoLine>
            ))}
            {updated ? <UpdatedAtLine value={updated} /> : null}
          </div>
        ) : null}

        {children}
      </CardContent>

      {!hideArrow && (
        <div
          className="border-t-surface pointer-events-none absolute -bottom-1 left-1/2 -translate-x-1/2 border-x-[6px] border-t-[6px] border-b-0 border-x-transparent"
          aria-hidden
        />
      )}
    </Card>
  )
}
