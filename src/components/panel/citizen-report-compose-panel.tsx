import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Button, IconButton } from '@/components/common'
import { focusRing } from '@/components/common/focus-ring'
import { getCopy } from '@/copy'
import {
  useCreateHotspotReport,
  type HotspotReportTarget,
  type HotspotSighting,
  hotspotSightingSchema,
} from '@/data/hotspot-reports'
import { restoreFocusTrigger } from '@/lib/focus-return'
import { friendlyActionError } from '@/lib/friendly-error'
import { isAllowedReportPhoto } from '@/lib/report-photo'
import { cn } from '@/lib/utils'
import { useToastStore } from '@/store/toast'
import { useUiStore } from '@/store/ui'

const SIGHTINGS = hotspotSightingSchema.options

const fieldClass = cn(
  'border-line bg-surface text-ink rounded-card w-full border px-3 shadow-none',
  'text-sm leading-5 outline-none',
  'focus-visible:ring-brand/40 focus-visible:ring-2',
)
/** Satu pola jarak label → kontrol di semua field. */
const fieldStack = 'flex flex-col gap-2'
const fieldLabel = 'text-ink-2 text-xs leading-4'

/** Form tulis laporan di side panel. */
export function CitizenReportComposePanel({ target }: { target: HotspotReportTarget }) {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const setReportTarget = useUiStore((s) => s.setReportTarget)
  const setSelectedReportId = useUiStore((s) => s.setSelectedReportId)
  const setPanelOpen = useUiStore((s) => s.setPanelOpen)
  const showToast = useToastStore((s) => s.showToast)

  const [sighting, setSighting] = useState<HotspotSighting>('asap')
  const [authorName, setAuthorName] = useState('')
  const [description, setDescription] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const createReport = useCreateHotspotReport()

  // Panel di-remount per target (key lat,lon di pemanggil) — state awal cukup dari useState.
  useEffect(() => {
    titleRef.current?.focus()
  }, [target])

  useEffect(
    () => () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview)
    },
    [photoPreview],
  )

  const back = () => {
    setReportTarget(null)
    restoreFocusTrigger()
  }

  const onPhotoChange = (file: File | undefined) => {
    setPhotoError(null)
    setPhotoFile(null)
    setPhotoPreview(null)
    if (!file) return
    if (!isAllowedReportPhoto(file)) {
      // Biar input native tidak terlihat “sudah isi” sementara state masih kosong.
      if (photoInputRef.current) photoInputRef.current.value = ''
      setPhotoError(getCopy().report.photoTooBig)
      return
    }
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  // Semua field wajib (sighting selalu terpilih via default).
  const canSubmit = Boolean(authorName.trim() && description.trim() && photoFile)

  const submit = () => {
    const name = authorName.trim()
    const desc = description.trim()
    if (!canSubmit || !photoFile) {
      setPhotoError(photoFile ? null : getCopy().report.photoMissing)
      return
    }
    setFormError(null)
    createReport.mutate(
      {
        lat: target.lat,
        lon: target.lon,
        region_code: target.region_code,
        hotspot_time: target.hotspot_time,
        sighting,
        author_name: name,
        description: desc,
        file: photoFile,
      },
      {
        onSuccess: (created) => {
          setReportTarget(null)
          setSelectedReportId(created.id)
          setPanelOpen(true)
          showToast(
            getCopy().report.submitSuccessTitle,
            getCopy().report.submitSuccess,
            'ok',
          )
        },
        onError: (error) => {
          // 429 dari BE: cukup toast global, form tetap terisi untuk dicoba lagi nanti.
          // shortcut: match both locales' rate-limit wording; upgrade when API returns an error code.
          if (/Batas permintaan|Request limit/i.test(error.message)) {
            setFormError(null)
            showToast(
              getCopy().report.rateLimitedTitle,
              getCopy().report.rateLimited,
              'err',
            )
            return
          }
          setFormError(friendlyActionError(error, getCopy().report.submitFailed))
        },
      },
    )
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="border-line bg-surface sticky top-0 z-10 flex items-center justify-between gap-2 border-b px-4 pt-3 pb-2">
        <h1
          ref={titleRef}
          tabIndex={-1}
          className="text-ink min-w-0 truncate text-sm leading-5 font-semibold outline-none"
        >
          {getCopy().report.formTitle}
        </h1>
        <IconButton onClick={back} aria-label={getCopy().report.formClose}>
          <X className="size-4 shrink-0" strokeWidth={2} aria-hidden />
        </IconButton>
      </div>

      <div className="flex flex-1 flex-col gap-6 px-4 pt-3 pb-4">
        <div className="space-y-1">
          <p className="text-ink-2 text-xs leading-4">{getCopy().report.disclaimer}</p>
          <p className="text-ink-2 text-xs leading-4">
            {getCopy()
              .report.emergencyHint.split(/(112)/g)
              .map((part, i) =>
                part === '112' ? (
                  <a
                    key={i}
                    href="tel:112"
                    className="text-risk-low font-semibold underline underline-offset-2 hover:opacity-80"
                  >
                    112
                  </a>
                ) : (
                  <span key={i}>{part}</span>
                ),
              )}
          </p>
        </div>

        <section aria-label={getCopy().report.formTitle} className="space-y-4">
          <label className={fieldStack}>
            <span className={fieldLabel}>{getCopy().report.authorLabel}</span>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              maxLength={80}
              placeholder={getCopy().report.authorPlaceholder}
              className={cn(fieldClass, 'h-11')}
            />
          </label>

          <div
            role="group"
            aria-labelledby="report-sighting-label"
            className={fieldStack}
          >
            <div id="report-sighting-label" className={fieldLabel}>
              {getCopy().report.sightingLabel}
            </div>
            <div className="flex flex-wrap gap-2">
              {SIGHTINGS.map((s) => {
                const pressed = sighting === s
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={pressed}
                    onClick={() => setSighting(s)}
                    className={cn(
                      'rounded-ctl inline-flex h-11 items-center border px-3 text-sm leading-5 font-medium shadow-none',
                      'transition-colors',
                      focusRing,
                      pressed
                        ? 'border-brand/30 bg-brand-soft text-brand'
                        : 'border-line bg-surface text-ink hover:bg-surface-muted',
                    )}
                  >
                    {getCopy().report.sightings[s]}
                  </button>
                )
              })}
            </div>
          </div>

          <label className={fieldStack}>
            <span className={fieldLabel}>{getCopy().report.descriptionLabel}</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder={getCopy().report.descriptionPlaceholder}
              className={cn(fieldClass, 'py-2')}
            />
          </label>

          <label className={fieldStack}>
            <span className={fieldLabel}>{getCopy().report.photoLabel}</span>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/*"
              className="text-ink-2 file:rounded-ctl file:bg-surface-muted block w-full text-xs file:mr-3 file:border-0 file:px-3 file:py-2 file:text-sm file:font-medium file:shadow-none"
              onChange={(e) => onPhotoChange(e.target.files?.[0])}
            />
            <span className={fieldLabel}>{getCopy().report.photoHint}</span>
            {photoPreview ? (
              <img
                src={photoPreview}
                alt={
                  authorName.trim()
                    ? getCopy().report.photoAlt(authorName.trim())
                    : getCopy().report.photoPreviewAlt
                }
                className="rounded-card aspect-[3/2] w-full object-cover"
              />
            ) : null}
          </label>
        </section>
      </div>

      <div className="border-line bg-surface sticky bottom-0 z-10 shrink-0 space-y-2 border-t px-4 py-3">
        {photoError || formError ? (
          <p className="text-risk-high text-sm leading-5" role="alert">
            {photoError ?? formError}
          </p>
        ) : null}
        <Button
          // Hijau hanya saat nama + deskripsi + foto siap.
          variant={canSubmit ? 'primary' : 'secondary'}
          className="w-full"
          onClick={submit}
          loading={createReport.isPending}
          disabled={!canSubmit || createReport.isPending}
        >
          {createReport.isPending ? getCopy().report.submitting : getCopy().report.submit}
        </Button>
      </div>
    </div>
  )
}
