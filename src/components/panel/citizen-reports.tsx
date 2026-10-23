import { CheckCircle2, ImagePlus, MapPin, MessageSquare, X } from 'lucide-react'
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import { Button } from '@/components/common/button'
import { focusRing } from '@/components/common/focus-ring'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { copy } from '@/copy/id'
import {
  reportPhotoSrc,
  useCreateHotspotReport,
  useHotspotReport,
  usePointHotspotReports,
  useRegionHotspotReports,
  type HotspotReport,
  type HotspotSighting,
} from '@/data/hotspot-reports'
import { formatDateTime, formatRelativeAge } from '@/lib/format'
import {
  formatPhotoBytes,
  MAX_REPORT_PHOTO_INPUT_BYTES,
  optimizeReportPhoto,
  REPORT_PHOTO_TYPES,
  type OptimizedReportPhoto,
} from '@/lib/report-photo'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'
import type { TimeZoneId } from '@/data/types'

const sightingLabel = {
  asap: 'Melihat asap',
  api_terlihat: 'Melihat api',
  tidak_yakin: 'Lainnya / belum yakin',
  sudah_padam: 'Sudah padam',
} as const

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
        src={reportPhotoSrc(item.photo_url)}
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
  const photoJob = useRef(0)
  const regionalReports = useRegionHotspotReports(regionCode)
  const create = useCreateHotspotReport()
  const reportHotspot = useMapStore((state) => state.reportHotspot)
  const reportHotspotKey = reportHotspot
    ? `${reportHotspot.time}|${reportHotspot.lat.toFixed(5)},${reportHotspot.lon.toFixed(5)}`
    : ''
  const [dismissedTargetKey, setDismissedTargetKey] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoDetails, setPhotoDetails] = useState<OptimizedReportPhoto | null>(null)
  const [isOptimizingPhoto, setIsOptimizingPhoto] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const [sighting, setSighting] = useState<HotspotSighting>('asap')
  const [selectedReport, setSelectedReport] = useState<HotspotReport | null>(null)
  // The map selection is the source of truth. Re-looking this up in an async
  // hotspot query made a freshly clicked marker briefly appear to have no target.
  const target = reportHotspot
  const open = Boolean(target) && reportHotspotKey !== dismissedTargetKey
  const pointReports = usePointHotspotReports(
    target ? { lat: target.lat, lon: target.lon } : undefined,
  )
  const reports = target ? pointReports : regionalReports
  const photoPreview = useMemo(
    () =>
      photo && typeof URL.createObjectURL === 'function'
        ? URL.createObjectURL(photo)
        : '',
    [photo],
  )
  useEffect(
    () => () => {
      if (photoPreview && typeof URL.revokeObjectURL === 'function') {
        URL.revokeObjectURL(photoPreview)
      }
    },
    [photoPreview],
  )

  const clearPhoto = () => {
    photoJob.current += 1
    setPhoto(null)
    setPhotoDetails(null)
    setIsOptimizingPhoto(false)
    setPhotoError('')
    if (fileRef.current) fileRef.current.value = ''
  }

  const selectPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.currentTarget.files?.[0] ?? null
    const job = photoJob.current + 1
    photoJob.current = job
    setPhoto(null)
    setPhotoDetails(null)
    setPhotoError('')
    if (!next) return
    if (!REPORT_PHOTO_TYPES.has(next.type)) {
      setPhotoError('Format foto harus JPEG, PNG, atau WebP.')
      event.currentTarget.value = ''
      return
    }
    if (next.size > MAX_REPORT_PHOTO_INPUT_BYTES) {
      setPhotoError('Foto asli melebihi batas 12 MiB.')
      event.currentTarget.value = ''
      return
    }

    setIsOptimizingPhoto(true)
    try {
      const optimized = await optimizeReportPhoto(next)
      if (photoJob.current !== job) return
      setPhoto(optimized.file)
      setPhotoDetails(optimized)
    } catch (error) {
      if (photoJob.current !== job) return
      setPhotoError(error instanceof Error ? error.message : 'Foto gagal dioptimalkan.')
      if (fileRef.current) fileRef.current.value = ''
    } finally {
      if (photoJob.current === job) setIsOptimizingPhoto(false)
    }
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!photo || !target || !name.trim()) return
    create.mutate(
      {
        lat: target.lat,
        lon: target.lon,
        region_code: regionCode,
        hotspot_time: target.time,
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
          setPhotoDetails(null)
          setPhotoError('')
          if (fileRef.current) fileRef.current.value = ''
          setDismissedTargetKey(reportHotspotKey)
        },
      },
    )
  }

  return (
    <Card className="border-brand/20 bg-surface">
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
      <CardContent className="pt-3">
        {target ? (
          <div className="border-brand/20 bg-brand-soft/45 rounded-ctl mb-3 flex items-start gap-2 border px-3 py-2">
            <MapPin className="text-brand mt-1 size-4 shrink-0" aria-hidden />
            <div className="min-w-0">
              <p className="text-ink text-xs font-semibold">Titik panas terpilih</p>
              <p className="text-ink-2 mt-1 text-xs leading-4">
                {target.lat.toFixed(5)}, {target.lon.toFixed(5)} · {formatDateTime(target.time, timeZone)}
                {target.frpMw != null ? ` · FRP ${target.frpMw.toLocaleString('id-ID')} MW` : ''}
              </p>
            </div>
          </div>
        ) : (
          <div className="border-line bg-surface-muted rounded-ctl mb-3 flex items-start gap-2 border px-3 py-2">
            <MapPin className="text-ink-2 mt-1 size-4 shrink-0" aria-hidden />
            <p className="text-ink-2 text-xs leading-5">
              Pilih titik panas di peta untuk melihat laporan pada titik itu atau mengirim laporan baru.
            </p>
          </div>
        )}
        {reports.isLoading ? <p className="text-ink-2 text-sm">Memuat laporan…</p> : null}
        {reports.isError ? (
          <p className="text-ink-2 text-sm">Laporan warga belum dapat dimuat.</p>
        ) : null}
        {reports.data?.length === 0 && target ? (
          <p className="text-ink-2 text-sm">
            Belum ada laporan warga pada titik panas ini.
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
                    src={reportPhotoSrc(report.photo_url)}
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
        {create.isSuccess && !open ? (
          <p
            role="status"
            className="text-risk-low bg-surface rounded-ctl mt-3 flex items-center gap-2 px-3 py-2 text-sm"
          >
            <CheckCircle2 className="size-4 shrink-0" aria-hidden />
            Laporan berhasil dikirim.
          </p>
        ) : null}
        {open ? (
          <form onSubmit={submit} className="border-line mt-3 space-y-3 border-t pt-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-ink text-sm font-semibold">Detail laporan</h3>
                <p className="text-ink-2 mt-1 text-xs leading-4">
                  Nama pelapor dan foto wajib diisi.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDismissedTargetKey(reportHotspotKey)}
                aria-label={copy.detail.closeReportForm}
                title={copy.detail.closeReportForm}
                className={cn(
                  'text-ink-2 hover:bg-surface-muted hover:text-ink rounded-ctl flex size-11 shrink-0 items-center justify-center',
                  focusRing,
                )}
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>

            <div className="grid gap-3 min-[520px]:grid-cols-2">
              <div className="space-y-1">
                <label
                  htmlFor={`${fieldId}-name`}
                  className="text-ink text-xs font-semibold"
                >
                  Nama pelapor <span className="text-risk-high">*</span>
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

              <div className="space-y-1">
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
            </div>

            <div className="space-y-1">
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
                  'border-line bg-surface rounded-ctl min-h-20 w-full resize-y border px-3 py-2 text-sm',
                  'placeholder:text-ink-3',
                  focusRing,
                )}
              />
            </div>

            <div className="space-y-1">
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
                onChange={(event) => void selectPhoto(event)}
                className="sr-only"
              />
              {photo ? (
                <div className="border-brand/30 bg-brand-soft rounded-ctl flex min-h-16 items-center gap-3 border px-3 py-2">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Pratinjau foto laporan"
                      className="rounded-ctl size-12 shrink-0 object-cover"
                    />
                  ) : (
                    <span className="bg-surface text-brand rounded-ctl flex size-9 shrink-0 items-center justify-center">
                      <CheckCircle2 className="size-4" aria-hidden />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-ink truncate text-sm font-medium">
                      {photoDetails?.originalName ?? photo.name}
                    </p>
                    <p className="text-ink-2 text-xs">
                      {photoDetails
                        ? `${formatPhotoBytes(photoDetails.originalBytes)} → ${formatPhotoBytes(photo.size)} WebP · ${photoDetails.outputWidth}×${photoDetails.outputHeight}`
                        : formatPhotoBytes(photo.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={copy.detail.removeReportPhoto}
                    onClick={clearPhoto}
                    className={cn(
                      'text-ink-2 hover:bg-surface rounded-ctl flex size-11 shrink-0 items-center justify-center',
                      focusRing,
                    )}
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                </div>
              ) : isOptimizingPhoto ? (
                <div
                  role="status"
                  className="border-brand/30 bg-brand-soft rounded-ctl flex min-h-20 items-center gap-3 border px-3 py-3"
                >
                  <span className="border-brand/30 border-t-brand size-8 shrink-0 animate-spin rounded-full border-2" />
                  <span className="text-ink text-sm font-medium">
                    Mengoptimalkan foto…
                  </span>
                </div>
              ) : (
                <label
                  htmlFor={`${fieldId}-photo`}
                  className={cn(
                    'border-line hover:border-brand/40 hover:bg-brand-soft/40 rounded-ctl flex min-h-16 cursor-pointer items-center gap-3 border border-dashed px-3 py-2 transition-colors',
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
                      JPEG, PNG, atau WebP hingga 12 MiB · Otomatis jadi WebP
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
              disabled={create.isPending || isOptimizingPhoto || !photo || !name.trim()}
              className="w-full min-[520px]:ml-auto min-[520px]:w-auto min-[520px]:min-w-40"
            >
              {create.isPending ? 'Mengirim…' : 'Kirim laporan'}
            </Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  )
}
