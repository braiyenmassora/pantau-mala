import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/common'
import { focusRing } from '@/components/common/focus-ring'
import { copy } from '@/copy/id'
import {
  useCreateHotspotReport,
  type HotspotReportTarget,
  type HotspotSighting,
  hotspotSightingSchema,
} from '@/data/hotspot-reports'
import { restoreFocusTrigger } from '@/lib/focus-return'
import { friendlyActionError } from '@/lib/friendly-error'
import { cn } from '@/lib/utils'
import { useToastStore } from '@/store/toast'
import { useUiStore } from '@/store/ui'

const SIGHTINGS = hotspotSightingSchema.options

const fieldClass = cn(
  'border-line bg-surface text-ink rounded-card w-full border px-3',
  'text-sm leading-5 outline-none',
  'focus-visible:ring-brand/40 focus-visible:ring-2',
)

/** Form tulis laporan di side panel. */
export function CitizenReportComposePanel({ target }: { target: HotspotReportTarget }) {
  const titleRef = useRef<HTMLHeadingElement>(null)
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
    if (
      !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
      file.size > 2 * 1024 * 1024
    ) {
      setPhotoError(copy.report.photoTooBig)
      return
    }
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const submit = () => {
    const name = authorName.trim()
    if (!name || !photoFile) {
      setPhotoError(photoFile ? null : copy.report.photoMissing)
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
        description: description.trim() || undefined,
        file: photoFile,
      },
      {
        onSuccess: (created) => {
          setReportTarget(null)
          setSelectedReportId(created.id)
          setPanelOpen(true)
          showToast(copy.report.submitSuccessTitle, copy.report.submitSuccess, 'ok')
        },
        onError: (error) => {
          // 429 dari BE: cukup toast global, form tetap terisi untuk dicoba lagi nanti.
          if (error.message.includes('Batas permintaan')) {
            setFormError(null)
            showToast(copy.report.rateLimitedTitle, copy.report.rateLimited, 'err')
            return
          }
          setFormError(friendlyActionError(error, copy.report.submitFailed))
        },
      },
    )
  }

  return (
    <div className="flex flex-col">
      <div className="bg-surface sticky top-0 z-10 flex items-center justify-between gap-2 px-4 pt-3 pb-2">
        <h1
          ref={titleRef}
          tabIndex={-1}
          className="text-ink min-w-0 truncate text-sm leading-5 font-semibold outline-none"
        >
          {copy.report.formTitle}
        </h1>
        <button
          type="button"
          onClick={back}
          aria-label={copy.report.close}
          className={cn(
            'text-ink-2 hover:bg-surface-muted rounded-ctl flex size-11 shrink-0 items-center justify-center transition-colors',
            focusRing,
          )}
        >
          <X className="size-4 shrink-0" strokeWidth={2} aria-hidden />
        </button>
      </div>

      <div className="flex flex-col gap-6 px-4 pt-3 pb-6">
        <p className="text-ink-2 text-xs leading-4">{copy.report.disclaimer}</p>

        <section aria-label={copy.report.formTitle} className="space-y-4">
          <label className="block space-y-1">
            <span className="text-ink-2 text-xs leading-4">{copy.report.authorLabel}</span>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              maxLength={80}
              placeholder={copy.report.authorPlaceholder}
              className={cn(fieldClass, 'h-11')}
            />
          </label>

          <fieldset className="space-y-2">
            <legend className="text-ink-2 text-xs leading-4">{copy.report.sightingLabel}</legend>
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
                      'rounded-ctl inline-flex h-11 items-center border px-3 text-sm leading-5 font-medium',
                      'transition-colors',
                      focusRing,
                      pressed
                        ? 'border-brand/30 bg-brand-soft text-brand'
                        : 'border-line bg-surface text-ink hover:bg-surface-muted',
                    )}
                  >
                    {copy.report.sightings[s]}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <label className="block space-y-1">
            <span className="text-ink-2 text-xs leading-4">{copy.report.descriptionLabel}</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder={copy.report.descriptionPlaceholder}
              className={cn(fieldClass, 'py-2')}
            />
          </label>

          <label className="block space-y-1">
            <span className="text-ink-2 text-xs leading-4">{copy.report.photoLabel}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="text-ink-2 block w-full text-xs file:mr-3 file:rounded-ctl file:border-0 file:bg-surface-muted file:px-3 file:py-2 file:text-sm file:font-medium"
              onChange={(e) => onPhotoChange(e.target.files?.[0])}
            />
            <span className="text-ink-2 text-xs leading-4">{copy.report.photoHint}</span>
            {photoPreview ? (
              <img
                src={photoPreview}
                alt=""
                className="mt-2 aspect-[3/2] w-full rounded-card object-cover"
              />
            ) : null}
          </label>

          {photoError || formError ? (
            <p className="text-risk-high text-sm leading-5" role="alert">
              {photoError ?? formError}
            </p>
          ) : null}

          <Button
            variant="primary"
            className="w-full shadow-none"
            onClick={submit}
            disabled={createReport.isPending}
          >
            {createReport.isPending ? copy.report.submitting : copy.report.submit}
          </Button>
        </section>
      </div>
    </div>
  )
}
