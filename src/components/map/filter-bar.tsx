import { Check, ChevronDown, ListFilter } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { Chip } from '@/components/common'
import { focusRing } from '@/components/common/focus-ring'
import { ProvincePicker } from '@/components/panel/province-picker'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { getCopy } from '@/copy'
import type { Region, RiskCategory } from '@/data/types'
import { filterRegions } from '@/lib/filter-regions'
import { formatNumber } from '@/lib/format'
import { isMobileWidth, useMapChrome } from '@/lib/layout'
import { RISK_CATEGORIES, riskCategoryLabel } from '@/lib/risk-category'
import { effectiveRiskCategory } from '@/lib/risk-rule'
import { CHROME } from '@/lib/pola'
import { mapOverlayGestureProps } from '@/lib/stop-map-gesture'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'

/** Chip filter risiko (nol titik hanya di Semua, bukan chip). */
const CATEGORY_BASE: RiskCategory[] = ['sangat_tinggi', 'sedang', 'rendah']

/** Di bawah ini: chip horizontal sulit dibaca → menu Risiko (~4 chip ≈ 720px). */
const RISK_MENU_MAX_AVAIL = 720

type FilterBarProps = {
  panelOpen: boolean
  regions: Region[]
}

/** Provinsi + chip risiko — menu Risiko saat chrome sempit (tablet + panel). */
export function FilterBar({ panelOpen, regions }: FilterBarProps) {
  const province = useMapStore((s) => s.province)
  const selectedCategories = useMapStore((s) => s.selectedCategories)
  const toggleCategory = useMapStore((s) => s.toggleCategory)
  const clearCategories = useMapStore((s) => s.clearCategories)

  const preCategory = useMemo(
    () =>
      filterRegions(regions, {
        province,
        query: '',
        selectedCategories: new Set(),
      }),
    [regions, province],
  )

  const counts = useMemo(() => {
    const next: Record<RiskCategory, number> = {
      tidak_tersedia: 0,
      tanpa_titik: 0,
      sangat_tinggi: 0,
      sedang: 0,
      rendah: 0,
    }
    for (const r of preCategory) next[effectiveRiskCategory(r)] += 1
    return next
  }, [preCategory])

  const allPressed = selectedCategories.size === 0
  const allCount = preCategory.length
  const categorySum = counts.sangat_tinggi + counts.sedang + counts.rendah

  const { left, availWidth, width } = useMapChrome(panelOpen)
  const riskMenu = availWidth < RISK_MENU_MAX_AVAIL
  // Mobile: selalu tampilkan picker (bar bisa di-scroll).
  // Tablet+ panel sempit: sembunyikan — ruang untuk Risiko; ganti via panel.
  const showProvince = isMobileWidth(width) || !(panelOpen && availWidth < 280)
  const rowRef = useRef<HTMLDivElement>(null)
  const [overflowX, setOverflowX] = useState(false)

  useEffect(() => {
    const el = rowRef.current
    if (!el) return
    const sync = () => setOverflowX(el.scrollWidth > el.clientWidth + 1)
    sync()
    const ro = new ResizeObserver(sync)
    ro.observe(el)
    return () => ro.disconnect()
  }, [availWidth, showProvince, riskMenu, allCount])

  return (
    <div
      ref={rowRef}
      className={cn(
        'soft-scroll fixed top-(--floating-control-offset) z-30',
        'flex items-center gap-1.5 overflow-x-auto overscroll-x-contain pb-1 sm:gap-2',
        overflowX && 'soft-fade-x pr-7',
        'ease-out-soft transition-[left,max-width] duration-300',
      )}
      style={{ left, maxWidth: availWidth }}
      {...mapOverlayGestureProps}
      data-category-sum={categorySum}
      data-all-count={allCount}
      data-risk-menu={riskMenu ? '1' : '0'}
    >
      {showProvince ? (
        <ProvincePicker
          regions={regions}
          className={cn(
            'shrink-0',
            (isMobileWidth(width) || availWidth < 320) && 'max-w-28',
          )}
        />
      ) : null}

      {riskMenu ? (
        <RiskFilterMenu
          allPressed={allPressed}
          allCount={allCount}
          counts={counts}
          selectedCategories={selectedCategories}
          onClear={clearCategories}
          onToggle={toggleCategory}
        />
      ) : (
        <>
          <Chip
            pressed={allPressed}
            disabled={allCount === 0}
            title={getCopy().filter.allStatusesTitle(formatNumber(allCount))}
            aria-label={getCopy().filter.allStatusesTitle(formatNumber(allCount))}
            onClick={clearCategories}
            className={cn(
              'shrink-0',
              allCount === 0 && 'pointer-events-none cursor-not-allowed opacity-40',
            )}
          >
            <span className="inline-flex items-center gap-2">
              <span>{getCopy().filter.allStatuses}</span>
              <span className="text-ink-3" aria-hidden>
                ·
              </span>
              <span className="font-mono text-sm leading-5 font-semibold tabular-nums">
                {formatNumber(allCount)}
              </span>
            </span>
          </Chip>

          {CATEGORY_BASE.map((category) => {
            const meta = RISK_CATEGORIES[category]
            const count = counts[category]
            const pressed = selectedCategories.has(category)
            const isZero = count === 0
            const chipTitle = getCopy().filter.categoryTitle(
              formatNumber(count),
              riskCategoryLabel(category),
            )

            return (
              <Chip
                key={category}
                pressed={pressed}
                disabled={isZero}
                title={chipTitle}
                aria-label={chipTitle}
                onClick={() => toggleCategory(category)}
                className={cn(
                  'shrink-0',
                  isZero && 'pointer-events-none cursor-not-allowed opacity-40',
                )}
              >
                <span
                  className={cn('size-2 shrink-0 rounded-full', meta.dotClass)}
                  aria-hidden
                />
                <span className="inline-flex items-center gap-2">
                  <span>{riskCategoryLabel(category)}</span>
                  <span className="text-ink-3" aria-hidden>
                    ·
                  </span>
                  <span className="font-mono text-sm leading-5 font-semibold tabular-nums">
                    {formatNumber(count)}
                  </span>
                </span>
              </Chip>
            )
          })}
        </>
      )}

      {/* Mobile: Provinsi → Risiko → Kerapatan. Desktop: MapLegend bawah. */}
      <DensityLegendChip />
    </div>
  )
}

/** Kerapatan di filter — mobile saja (`sm:hidden`); desktop pakai MapLegend. */
function DensityLegendChip() {
  const aria = `${getCopy().legend.densityTitle}: ${getCopy().legend.densityLow}, ${getCopy().legend.densityMid}, ${getCopy().legend.densityHigh}`
  return (
    <div
      role="img"
      data-testid="density-legend-chip"
      aria-label={aria}
      title={aria}
      className={cn(
        CHROME.mapFilterTrigger,
        'flex h-11 min-h-11 shrink-0 items-center gap-1 px-2 sm:hidden',
      )}
    >
      <span className="text-ink-2 text-xs leading-4 font-medium whitespace-nowrap">
        {getCopy().legend.densityTitle}
      </span>
      <span
        className="h-1.5 w-8 shrink-0 rounded-full"
        style={{
          background:
            'linear-gradient(90deg, var(--color-heat-low), var(--color-heat-mid), var(--color-heat-high))',
        }}
        aria-hidden
      />
    </div>
  )
}

type RiskFilterMenuProps = {
  allPressed: boolean
  allCount: number
  counts: Record<RiskCategory, number>
  selectedCategories: Set<RiskCategory>
  onClear: () => void
  onToggle: (category: RiskCategory) => void
}

function RiskFilterMenu({
  allPressed,
  allCount,
  counts,
  selectedCategories,
  onClear,
  onToggle,
}: RiskFilterMenuProps) {
  const [open, setOpen] = useState(false)
  const activeCount = allPressed ? 0 : selectedCategories.size
  const summary = allPressed
    ? `${getCopy().filter.allStatuses} · ${formatNumber(allCount)}`
    : [...selectedCategories]
        .map((c) => `${riskCategoryLabel(c)} · ${formatNumber(counts[c])}`)
        .join(', ')

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Chip
          pressed={!allPressed}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label={
            allPressed
              ? getCopy().filter.allStatusesTitle(formatNumber(allCount))
              : getCopy().filter.riskMenuTitle(formatNumber(activeCount))
          }
          title={summary}
          className="shrink-0 gap-1.5 px-2.5 sm:gap-2 sm:px-3"
        >
          <ListFilter
            className="text-brand hidden size-4 shrink-0 sm:block"
            strokeWidth={1.75}
            aria-hidden
          />
          <span className="max-w-24 truncate sm:max-w-40">
            {allPressed ? (
              <>
                {getCopy().filter.riskMenu}
                <span className="text-ink-3"> · </span>
                <span className="font-mono tabular-nums">{formatNumber(allCount)}</span>
              </>
            ) : (
              getCopy().filter.riskMenu
            )}
          </span>
          {!allPressed && activeCount > 0 ? (
            <span className="bg-brand text-surface rounded-ctl px-2 font-mono text-xs tabular-nums">
              {activeCount}
            </span>
          ) : null}
          <ChevronDown
            className={cn(
              'text-brand size-4 shrink-0 transition-transform duration-200',
              open && 'rotate-180',
            )}
            strokeWidth={1.75}
            aria-hidden
          />
        </Chip>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={6}
        className={cn(CHROME.mapFilterPopover, 'z-50 w-64 p-1')}
        role="listbox"
        aria-label={getCopy().filter.riskMenu}
      >
        <RiskMenuRow
          pressed={allPressed}
          disabled={allCount === 0}
          label={getCopy().filter.allStatuses}
          count={allCount}
          onSelect={() => {
            onClear()
            setOpen(false)
          }}
        />
        {CATEGORY_BASE.map((category) => {
          const meta = RISK_CATEGORIES[category]
          const count = counts[category]
          return (
            <RiskMenuRow
              key={category}
              pressed={selectedCategories.has(category)}
              disabled={count === 0}
              label={riskCategoryLabel(category)}
              count={count}
              dotClass={meta.dotClass}
              onSelect={() => onToggle(category)}
            />
          )
        })}
      </PopoverContent>
    </Popover>
  )
}

function RiskMenuRow({
  pressed,
  disabled,
  label,
  count,
  dotClass,
  onSelect,
}: {
  pressed: boolean
  disabled: boolean
  label: string
  count: number
  dotClass?: string
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={pressed}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'rounded-ctl flex w-full items-center gap-2 px-2 py-3 text-left text-sm leading-5',
        focusRing,
        disabled
          ? 'text-ink-3 cursor-not-allowed opacity-40'
          : 'hover:bg-surface-muted text-ink',
        pressed && !disabled && 'bg-brand-soft text-brand',
      )}
    >
      {dotClass ? (
        <span className={cn('size-2 shrink-0 rounded-full', dotClass)} aria-hidden />
      ) : (
        <span className="size-2 shrink-0" aria-hidden />
      )}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className="font-mono text-sm tabular-nums">{formatNumber(count)}</span>
      {pressed ? (
        <Check className="text-brand size-4 shrink-0" strokeWidth={2} aria-hidden />
      ) : (
        <span className="size-4 shrink-0" aria-hidden />
      )}
    </button>
  )
}
