import { Check, ChevronDown, ListFilter } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Chip } from '@/components/common'
import { focusRing } from '@/components/common/focus-ring'
import { ProvincePicker } from '@/components/panel/province-picker'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { copy } from '@/copy/id'
import type { Region, RiskCategory } from '@/data/types'
import { filterRegions } from '@/lib/filter-regions'
import { formatNumber } from '@/lib/format'
import { useMapChrome } from '@/lib/layout'
import { RISK_CATEGORIES } from '@/lib/risk-category'
import { effectiveRiskCategory } from '@/lib/risk-rule'
import { mapOverlayGestureProps } from '@/lib/stop-map-gesture'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'

/** Semua kategori risiko yang dihitung ke total "Semua". */
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
      sangat_tinggi: 0,
      sedang: 0,
      rendah: 0,
    }
    for (const r of preCategory) next[effectiveRiskCategory(r)] += 1
    return next
  }, [preCategory])

  const allPressed = selectedCategories.size === 0
  const allCount = preCategory.length
  const categorySum =
    counts.sangat_tinggi + counts.sedang + counts.rendah + counts.tidak_tersedia

  const { left, availWidth } = useMapChrome(panelOpen)
  const riskMenu = availWidth < RISK_MENU_MAX_AVAIL
  // Panel terbuka + chrome sempit: picker di panel; sisakan ruang untuk menu Risiko.
  const showProvince = !(panelOpen && availWidth < 280)

  return (
    <div
      className={cn(
        'soft-scroll soft-fade-x fixed top-(--floating-control-offset) z-30',
        'flex items-center gap-2 overflow-x-auto overscroll-x-contain pr-7 pb-1',
        'ease-out-soft transition-[left,max-width] duration-300',
        panelOpen && 'max-sm:hidden',
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
          className={cn('shrink-0', availWidth < 320 && 'max-w-36')}
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
            title={copy.filter.allStatusesTitle(formatNumber(allCount))}
            aria-label={copy.filter.allStatusesTitle(formatNumber(allCount))}
            onClick={clearCategories}
            className={cn(
              'shrink-0',
              allCount === 0 && 'pointer-events-none cursor-not-allowed opacity-40',
            )}
          >
            <span className="inline-flex items-center gap-2">
              <span>{copy.filter.allStatuses}</span>
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

            return (
              <Chip
                key={category}
                pressed={pressed}
                disabled={isZero}
                title={copy.filter.categoryTitle(formatNumber(count), meta.label)}
                aria-label={copy.filter.categoryTitle(formatNumber(count), meta.label)}
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
                  <span>{meta.label}</span>
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
    ? `${copy.filter.allStatuses} · ${formatNumber(allCount)}`
    : [...selectedCategories]
        .map((c) => `${RISK_CATEGORIES[c].label} · ${formatNumber(counts[c])}`)
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
              ? copy.filter.allStatusesTitle(formatNumber(allCount))
              : copy.filter.riskMenuTitle(formatNumber(activeCount))
          }
          title={summary}
          className="shrink-0"
        >
          <ListFilter className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
          <span className="max-w-28 truncate sm:max-w-40">
            {allPressed ? (
              <>
                {copy.filter.riskMenu}
                <span className="text-ink-3"> · </span>
                <span className="font-mono tabular-nums">{formatNumber(allCount)}</span>
              </>
            ) : (
              copy.filter.riskMenu
            )}
          </span>
          {!allPressed && activeCount > 0 ? (
            <span className="bg-brand text-surface rounded-ctl px-2 font-mono text-xs tabular-nums">
              {activeCount}
            </span>
          ) : null}
          <ChevronDown
            className={cn(
              'text-ink-2 size-4 shrink-0 transition-transform duration-200',
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
        className="rounded-card border-line bg-surface text-ink shadow-chrome z-50 w-64 border p-1"
        role="listbox"
        aria-label={copy.filter.riskMenu}
      >
        <RiskMenuRow
          pressed={allPressed}
          disabled={allCount === 0}
          label={copy.filter.allStatuses}
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
              label={meta.label}
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
        <Check className="size-4 shrink-0" strokeWidth={2} aria-hidden />
      ) : (
        <span className="size-4 shrink-0" aria-hidden />
      )}
    </button>
  )
}
