import { CheckCircle2, ImagePlus, MapPin, MessageSquare, X } from 'lucide-react'
import { useId, useMemo, useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/common/button'
import { focusRing } from '@/components/common/focus-ring'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { copy } from '@/copy/id'
import {
  useCreateHotspotReport,
  useHotspotReport,
  usePointHotspotReports,
  useRegionHotspotReports,
  type HotspotReport,
  type HotspotSighting,
} from '@/data/hotspot-reports'
import { useHotspots } from '@/data/queries'
import { formatDateTime, formatRelativeAge } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useMapStore, type ReportHotspot } from '@/store/map'
import type { TimeZoneId } from '@/data/types'

const MAX_PHOTO_BYTES = 2 * 1024 * 1024
const PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

const sightingLabel = {
  asap: 'Melihat asap',
  api_terlihat: 'Melihat api',
  tidak_yakin: 'Lainnya / belum yakin',
  sudah_padam: 'Sudah padam',
} as const

const pointKey = (lat: number, lon: number) => `${lat.toFixed(5)},${lon.toFixed(5)}`

function ReportDetail({
  report,
  onClose,
  timeZone,
}: {
  report: HotspotReport
  onClose: () => void
  timeZone: TimeZoneId
}) {
  const detail = useHotspotReport(report.id)
  const item = detail.data ?? report

  return (
    <section className="border-brand/20 bg-surface-muted rounded-card mt-3 border p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-ink text-sm font-semibold">Laporan {item.author_name}</h3>
          <p className="text-ink-2 mt-1 text-xs">
            {formatDateTime(item.created_at, timeZone)} · {sightingLabel[item.sighting]}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={copy.detail.closeReportDetail}
          className={cn(
            'text-ink-2 hover:bg-surface flex size-11 shrink-0 items-center justify-center rounded-full',
            focusRing,
          )}
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
      {detail.isError ? (
        <p role="alert" className="text-ink-2 mt-3 text-xs">
          Detail terbaru belum dapat dimuat; ringkasan terakhir tetap ditampilkan.
        </p>
      ) : null}
      <img
        src={item.photo_url}
        alt={`Foto laporan kondisi lapangan oleh ${item.author_name}`}
        className="rounded-card mt-3 aspect-[4/3] w-full object-cover"
      />
      {item.description ? (
        <p className="text-ink mt-3 text-sm leading-6">{item.description}</p>
      ) : null}
      <p className="text-ink-3 mt-3 flex items-center gap-1 text-xs">
        <MapPin className="size-3.5" aria-hidden />
        Titik {item.point_lat.toFixed(5)}, {item.point_lon.toFixed(5)}
      </p>
    </section>
  )
}

export function CitizenReports({
  regionCode,
  timeZone = 'WIB',
}: {
  regionCode: string
  timeZone?: TimeZoneId
}) {
  const fieldId = useId()
  const fileRef = useRef<HTMLInputElement>(null)
  const regionalReports = useRegionHotspotReports(regionCode)
  const hotspots = useHotspots()
  const create = useCreateHotspotReport()
  const reportHotspot = useMapStore((state) => state.reportHotspot)
  const setReportHotspot = useMapStore((state) => state.setReportHotspot)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoError, setPhotoError] = useState('')
  const [sighting, setSighting] = useState<HotspotSighting>('asap')
  const [selectedReport, setSelectedReport] = useState<HotspotReport | null>(null)
  const regionHotspots = useMemo(
    () =>
      (hotspots.data?.features ?? [])
        .filter((feature) => feature.properties.region_code === regionCode)
        .sort(
          (left, right) =>
            Date.parse(right.properties.time) - Date.parse(left.properties.time),
        ),
    [hotspots.data?.features, regionCode],
  )
  const target = reportHotspot
    ? regionHotspots.find(
        (feature) =>
          feature.properties.time === reportHotspot.time &&
          pointKey(feature.geometry.coordinates[1], feature.geometry.coordinates[0]) ===
            pointKey(reportHotspot.lat, reportHotspot.lon),
      )
    : undefined
  const pointReports = usePointHotspotReports(
    target
      ? { lat: target.geometry.coordinates[1], lon: target.geometry.coordinates[0] }
      : undefined,
  )
  const reports = target ? pointReports : regionalReports
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!photo || !target || !name.trim()) return
    const [lon, lat] = target.geometry.coordinates
    create.mutate(
      {
        lat,
        lon,
        region_code: regionCode,
        hotspot_time: target.properties.time,
        sighting,
        author_name: name.trim(),
        description: description.trim() || undefined,
        file: photo,
      },
      {
        onSuccess: () => {
          setName('')
          setDescription('')
          setPhoto(null)
          setPhotoError('')
          if (fileRef.current) fileRef.current.value = ''
          setOpen(false)
        },
      },
    )
  }

  return (
    <Card className="border-brand/20 bg-brand-soft/30">
      <CardHeader className="flex-row items-start gap-3">
        <span className="bg-surface text-brand flex size-8 shrink-0 items-center justify-center rounded-full shadow-sm">
          <MessageSquare className="size-4" strokeWidth={1.8} aria-hidden />
        </span>
        <div className="min-w-0">
          <CardTitle>Laporan warga</CardTitle>
          <p className="text-ink-2 mt-1 text-xs leading-5">
            Bagikan kondisi yang kamu lihat di sekitar titik ini.
          </p>
        </div>
      </CardHeader>
      <CardContent>
        {regionHotspots.length > 0 ? (
          <div className="mb-4 space-y-2">
            <label
              htmlFor={`${fieldId}-target`}
              className="text-ink text-xs font-semibold"
            >
              Titik panas yang dilaporkan
            </label>
            <select
              id={`${fieldId}-target`}
              value={
                target
                  ? `${target.properties.time}|${pointKey(target.geometry.coordinates[1], target.geometry.coordinates[0])}`
                  : ''
              }
              onChange={(event) => {
                const feature = regionHotspots.find(
                  (item) =>
                    `${item.properties.time}|${pointKey(item.geometry.coordinates[1], item.geometry.coordinates[0])}` ===
                    event.target.value,
                )
                setSelectedReport(null)
                setReportHotspot(
                  feature
                    ? ({
                        lat: feature.geometry.coordinates[1],
                        lon: feature.geometry.coordinates[0],
                        time: feature.properties.time,
                        frpMw: feature.properties.frp_mw,
                        satellite: feature.properties.satellite,
                      } satisfies ReportHotspot)
                    : null,
                )
              }}
              className={cn(
                'border-line bg-surface rounded-ctl h-11 w-full border px-3 text-sm',
                focusRing,
              )}
            >
              <option value="">Pilih titik pada peta atau daftar ini</option>
              {regionHotspots.map((feature) => {
                const [lon, lat] = feature.geometry.coordinates
                const value = `${feature.properties.time}|${pointKey(lat, lon)}`
                return (
                  <option key={value} value={value}>
                    {formatDateTime(feature.properties.time, timeZone)} · FRP{' '}
                    {feature.properties.frp_mw.toLocaleString('id-ID')} MW
                  </option>
                )
              })}
            </select>
            <p className="text-ink-3 text-xs leading-4">
              {target
                ? `Titik ${target.geometry.coordinates[1].toFixed(5)}, ${target.geometry.coordinates[0].toFixed(5)}`
                : 'Pilih titik agar laporan dan jumlah warga tidak tercampur antar lokasi.'}
            </p>
          </div>
        ) : null}
        {reports.isLoading ? <p className="text-ink-2 text-sm">Memuat laporan…</p> : null}
        {reports.isError ? (
          <p className="text-ink-2 text-sm">Laporan warga belum dapat dimuat.</p>
        ) : null}
        {reports.data?.length === 0 ? (
          <p className="text-ink-2 text-sm">
            {target
              ? 'Belum ada laporan warga pada titik panas ini.'
              : 'Pilih titik panas untuk melihat laporan pada lokasi yang sama.'}
          </p>
        ) : null}
        {reports.data?.length ? (
          <ul className="divide-line divide-y">
            {reports.data.map((report) => (
              <li key={report.id} className="py-2 first:pt-0 last:pb-0">
                <button
                  type="button"
                  onClick={() => setSelectedReport(report)}
                  className={cn(
                    'hover:bg-surface-muted rounded-ctl flex min-h-11 w-full items-start gap-3 p-1 text-left',
                    focusRing,
                  )}
                >
                  <MessageSquare
                    className="text-brand mt-1 size-4 shrink-0"
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-ink truncate text-sm font-semibold">
                        {report.author_name}
                      </p>
                      <time
                        className="text-ink-2 shrink-0 text-xs"
                        dateTime={report.created_at}
                      >
                        {formatRelativeAge(report.created_at)}
                      </time>
                    </div>
                    <p className="text-ink-2 text-xs">{sightingLabel[report.sighting]}</p>
                    {report.description ? (
                      <p className="text-ink mt-1 text-sm leading-5">
                        {report.description}
                      </p>
                    ) : null}
                  </div>
                  <img
                    src={report.photo_url}
                    alt=""
                    className="rounded-ctl size-14 shrink-0 object-cover"
                    loading="lazy"
                  />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {selectedReport ? (
          <ReportDetail
            report={selectedReport}
            timeZone={timeZone}
            onClose={() => setSelectedReport(null)}
          />
        ) : null}
        {regionHotspots.length === 0 && !hotspots.isLoading ? (
          <p className="text-ink-2 mt-4 text-xs">
            Belum ada titik panas aktif yang dapat dilaporkan di wilayah ini.
          </p>
        ) : null}
        {create.isSuccess && !open ? (
          <p
            role="status"
            className="text-risk-low bg-surface rounded-ctl mt-3 flex items-center gap-2 px-3 py-2 text-sm"
          >
            <CheckCircle2 className="size-4 shrink-0" aria-hidden />
            Laporan berhasil dikirim.
          </p>
        ) : null}
        {!open ? (
          <Button
            variant="soft"
            size="md"
            disabled={!target}
            onClick={() => {
              create.reset()
              setOpen(true)
            }}
            className="mt-4 w-full"
          >
            Kirim laporan
          </Button>
        ) : null}
        {open ? (
          <form
            onSubmit={submit}
            className="border-line bg-surface rounded-card mt-3 space-y-4 border p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-ink text-sm font-semibold">Detail laporan</h3>
                <p className="text-ink-2 mt-1 text-xs leading-4">
                  Foto dan nama tampilan wajib diisi.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={cn(
                  'text-ink-2 hover:bg-surface-muted hover:text-ink rounded-ctl flex min-h-11 items-center gap-1 px-3 text-xs font-medium',
                  focusRing,
                )}
              >
                <X className="size-4" aria-hidden />
                Tutup
              </button>
            </div>

            <div className="space-y-2">
              <label
                htmlFor={`${fieldId}-name`}
                className="text-ink text-xs font-semibold"
              >
                Nama tampilan <span className="text-risk-high">*</span>
              </label>
              <input
                id={`${fieldId}-name`}
                required
                maxLength={80}
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={copy.detail.reportNamePlaceholder}
                className={cn(
                  'border-line bg-surface rounded-ctl h-11 w-full border px-3 text-sm',
                  'placeholder:text-ink-3',
                  focusRing,
                )}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor={`${fieldId}-sighting`}
                className="text-ink text-xs font-semibold"
              >
                Apa yang terlihat? <span className="text-risk-high">*</span>
              </label>
              <select
                id={`${fieldId}-sighting`}
                value={sighting}
                onChange={(e) => setSighting(e.target.value as HotspotSighting)}
                className={cn(
                  'border-line bg-surface rounded-ctl h-11 w-full border px-3 text-sm',
                  focusRing,
                )}
              >
                {Object.entries(sightingLabel).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor={`${fieldId}-description`}
                  className="text-ink text-xs font-semibold"
                >
                  Catatan <span className="text-ink-3 font-normal">(opsional)</span>
                </label>
                <span className="text-ink-3 text-xs tabular-nums">
                  {description.length}/500
                </span>
              </div>
              <textarea
                id={`${fieldId}-description`}
                maxLength={500}
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={copy.detail.reportDescriptionPlaceholder}
                className={cn(
                  'border-line bg-surface rounded-ctl min-h-24 w-full resize-y border px-3 py-2 text-sm',
                  'placeholder:text-ink-3',
                  focusRing,
                )}
              />
            </div>

            <div className="space-y-2">
              <span className="text-ink block text-xs font-semibold">
                Bukti foto <span className="text-risk-high">*</span>
              </span>
              <input
                ref={fileRef}
                id={`${fieldId}-photo`}
                required
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-describedby={`${fieldId}-photo-help`}
                onChange={(e) => {
                  const next = e.target.files?.[0] ?? null
                  if (next && !PHOTO_TYPES.has(next.type)) {
                    setPhoto(null)
                    setPhotoError('Format foto harus JPEG, PNG, atau WebP.')
                    e.currentTarget.value = ''
                    return
                  }
                  if (next && next.size > MAX_PHOTO_BYTES) {
                    setPhoto(null)
                    setPhotoError('Ukuran foto melebihi batas 2 MiB.')
                    e.currentTarget.value = ''
                    return
                  }
                  setPhoto(next)
                  setPhotoError('')
                }}
                className="sr-only"
              />
              {photo ? (
                <div className="border-brand/30 bg-brand-soft rounded-ctl flex min-h-16 items-center gap-3 border px-3 py-2">
                  <span className="bg-surface text-brand rounded-ctl flex size-9 shrink-0 items-center justify-center">
                    <CheckCircle2 className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-ink truncate text-sm font-medium">{photo.name}</p>
                    <p className="text-ink-2 text-xs">
                      {(photo.size / 1024 / 1024).toLocaleString('id-ID', {
                        maximumFractionDigits: 1,
                      })}{' '}
                      MiB
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={copy.detail.removeReportPhoto}
                    onClick={() => {
                      setPhoto(null)
                      if (fileRef.current) fileRef.current.value = ''
                    }}
                    className={cn(
                      'text-ink-2 hover:bg-surface rounded-ctl flex size-11 shrink-0 items-center justify-center',
                      focusRing,
                    )}
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor={`${fieldId}-photo`}
                  className={cn(
                    'border-line hover:border-brand/40 hover:bg-brand-soft/40 rounded-ctl flex min-h-20 cursor-pointer items-center gap-3 border border-dashed px-3 py-3 transition-colors',
                    focusRing,
                  )}
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      fileRef.current?.click()
                    }
                  }}
                >
                  <span className="bg-brand-soft text-brand flex size-10 shrink-0 items-center justify-center rounded-full">
                    <ImagePlus className="size-5" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="text-ink block text-sm font-semibold">
                      Pilih foto dari perangkat
                    </span>
                    <span
                      id={`${fieldId}-photo-help`}
                      className="text-ink-2 mt-1 block text-xs leading-4"
                    >
                      JPEG, PNG, atau WebP · Maksimal 2 MiB
                    </span>
                  </span>
                </label>
              )}
              {photoError ? (
                <p role="alert" className="text-risk-high text-xs">
                  {photoError}
                </p>
              ) : null}
            </div>

            {create.isError ? (
              <p role="alert" className="text-risk-high text-sm">
                Laporan belum dapat dikirim. Coba lagi.
              </p>
            ) : null}
            <Button
              type="submit"
              size="md"
              loading={create.isPending}
              disabled={create.isPending || !photo || !name.trim()}
              className="w-full"
            >
              {create.isPending ? 'Mengirim…' : 'Kirim laporan'}
            </Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  )
}
