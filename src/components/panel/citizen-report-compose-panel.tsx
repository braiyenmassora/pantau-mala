import { Check, ChevronDown, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { CloseIconButton } from '@/components/common'
import { focusRing } from '@/components/common/focus-ring'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { getCopy } from '@/copy'
import {
  useCreateHotspotReport,
  type HotspotReportTarget,
  type HotspotSighting,
  hotspotSightingSchema,
} from '@/data/hotspot-reports'
import { restoreFocusTrigger } from '@/lib/focus-return'
import { friendlyActionError } from '@/lib/friendly-error'
import { CHROME, PANEL, T } from '@/lib/pola'
import { isAllowedReportPhoto } from '@/lib/report-photo'
import { cn } from '@/lib/utils'
import { useToastStore } from '@/store/toast'
import { useUiStore } from '@/store/ui'

const SIGHTINGS = hotspotSightingSchema.options

const fieldStack = 'flex flex-col gap-2'

/** Form tulis laporan — shell ikut panel (bukan card terpisah). */
export function CitizenReportComposePanel({ target }: { target: HotspotReportTarget }) {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const setReportTarget = useUiStore((s) => s.setReportTarget)
  const setSelectedReportId = useUiStore((s) => s.setSelectedReportId)
  const setPanelOpen = useUiStore((s) => s.setPanelOpen)
  const showToast = useToastStore((s) => s.showToast)

  const [sighting, setSighting] = useState<HotspotSighting>('asap')
  const [topicOpen, setTopicOpen] = useState(false)
  const [authorName, setAuthorName] = useState('')
  const [description, setDescription] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const createReport = useCreateHotspotReport()

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
      if (photoInputRef.current) photoInputRef.current.value = ''
      setPhotoError(getCopy().report.photoTooBig)
      return
    }
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

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
    <div className="bg-surface flex min-h-full flex-col">
      <div
        className={cn(
          PANEL.stickyHeader,
          PANEL.pad,
          PANEL.header,
          'flex items-center justify-between gap-2',
        )}
      >
        <h1
          ref={titleRef}
          tabIndex={-1}
          className={cn(T.title, 'min-w-0 truncate outline-none')}
        >
          {getCopy().report.formTitle}
        </h1>
        <CloseIconButton onClick={back} aria-label={getCopy().report.formClose}>
          <X className="size-4 shrink-0" strokeWidth={2} aria-hidden />
        </CloseIconButton>
      </div>

      <div className={cn(PANEL.body, PANEL.pad, 'divide-line flex-1 gap-0 divide-y')}>
        <div className={cn(PANEL.sectionY, 'space-y-2')}>
          <p className={T.quiet}>{getCopy().report.disclaimer}</p>
          <p className={T.quiet}>
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

        {/* Topik */}
        <section
          aria-labelledby="report-section-topic"
          className={cn(PANEL.sectionY, 'space-y-3')}
        >
          <h2 id="report-section-topic" className={T.section}>
            {getCopy().report.sectionTopic}
          </h2>
          <div className={fieldStack}>
            <span className={T.fieldLabel}>{getCopy().report.sightingLabel}</span>
            <Popover open={topicOpen} onOpenChange={setTopicOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-expanded={topicOpen}
                  aria-haspopup="listbox"
                  className={cn(
                    CHROME.mapFilterTrigger,
                    'inline-flex h-11 w-full items-center justify-between gap-2 px-3 text-left text-sm leading-5 font-medium',
                    focusRing,
                  )}
                >
                  <span className="min-w-0 truncate">
                    {getCopy().report.sightings[sighting]}
                  </span>
                  <ChevronDown
                    className={cn(
                      'text-brand ease-out-soft size-4 shrink-0 transition-transform duration-200',
                      topicOpen && 'rotate-180',
                    )}
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                side="bottom"
                sideOffset={6}
                className={cn(
                  CHROME.mapFilterPopover,
                  'z-50 max-h-80 w-[var(--radix-popover-trigger-width)] overflow-hidden p-2',
                )}
              >
                <div
                  role="listbox"
                  aria-label={getCopy().report.sightingPick}
                  className="soft-scroll max-h-60 overflow-y-auto"
                >
                  {SIGHTINGS.map((s) => {
                    const selected = sighting === s
                    return (
                      <button
                        key={s}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onClick={() => {
                          setSighting(s)
                          setTopicOpen(false)
                        }}
                        className={cn(
                          'rounded-ctl flex h-10 w-full cursor-pointer items-center justify-between gap-2 px-3 text-left text-sm leading-5 font-medium',
                          'ease-out-soft transition-colors duration-150',
                          'hover:bg-surface-muted',
                          focusRing,
                          selected && 'bg-brand-soft text-brand font-semibold',
                        )}
                      >
                        <span className="min-w-0 flex-1 truncate">
                          {getCopy().report.sightings[s]}
                        </span>
                        {selected ? (
                          <Check
                            className="text-brand size-4 shrink-0"
                            strokeWidth={2}
                            aria-hidden
                          />
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </section>

        {/* Usulan */}
        <section
          aria-labelledby="report-section-suggestion"
          className={cn(PANEL.sectionY, 'space-y-3')}
        >
          <h2 id="report-section-suggestion" className={T.section}>
            {getCopy().report.sectionSuggestion}
          </h2>
          <label className={fieldStack}>
            <span className={T.fieldLabel}>{getCopy().report.descriptionLabel}</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder={getCopy().report.descriptionPlaceholder}
              className={cn(CHROME.field, 'h-auto min-h-24 resize-y py-2')}
            />
          </label>
          <label className={fieldStack}>
            <span className={T.fieldLabel}>{getCopy().report.photoLabel}</span>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/*"
              className={cn(
                CHROME.field,
                'text-ink-2 file:text-ink cursor-pointer py-2 text-xs leading-4',
                'file:rounded-ctl file:mr-3 file:border-0 file:bg-transparent file:px-0 file:text-sm file:font-medium',
              )}
              onChange={(e) => onPhotoChange(e.target.files?.[0])}
            />
            <span className={T.quiet}>{getCopy().report.photoHint}</span>
            {photoPreview ? (
              <img
                src={photoPreview}
                alt={
                  authorName.trim()
                    ? getCopy().report.photoAlt(authorName.trim())
                    : getCopy().report.photoPreviewAlt
                }
                className="rounded-ctl aspect-[3/2] w-full object-cover"
              />
            ) : null}
          </label>
        </section>

        {/* Data kamu */}
        <section
          aria-labelledby="report-section-reporter"
          className={cn(PANEL.sectionY, 'space-y-3')}
        >
          <h2 id="report-section-reporter" className={T.section}>
            {getCopy().report.sectionReporter}
          </h2>
          <label className={fieldStack}>
            <span className={T.fieldLabel}>{getCopy().report.authorLabel}</span>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              maxLength={80}
              placeholder={getCopy().report.authorPlaceholder}
              className={CHROME.field}
              autoComplete="name"
            />
            <span className={T.quiet}>{getCopy().report.authorHint}</span>
          </label>
        </section>
      </div>

      <div
        className={cn(
          'border-line bg-surface sticky bottom-0 z-10 shrink-0 space-y-2 border-t',
          PANEL.pad,
          PANEL.footer,
        )}
      >
        {photoError || formError ? (
          <p className="text-risk-high text-sm leading-5" role="alert">
            {photoError ?? formError}
          </p>
        ) : null}
        <button
          type="button"
          className={cn(
            CHROME.ctaPrimary,
            'w-full',
            focusRing,
            !canSubmit && 'opacity-50',
          )}
          onClick={submit}
          disabled={!canSubmit || createReport.isPending}
          aria-busy={createReport.isPending || undefined}
        >
          {createReport.isPending ? getCopy().report.submitting : getCopy().report.submit}
        </button>
      </div>
    </div>
  )
}
