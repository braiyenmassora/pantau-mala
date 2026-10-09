import { RISK_CATEGORIES, withAlpha } from '@/lib/risk-category'
import { cn } from '@/lib/utils'

type MapLegendProps = {
  panelOpen: boolean
}

export function MapLegend({ panelOpen }: MapLegendProps) {
  const high = RISK_CATEGORIES.sangat_tinggi.dot
  const mid = RISK_CATEGORIES.sedang.dot

  return (
    <div
      className={cn(
        'absolute bottom-4 z-30 flex h-9 items-center gap-3 rounded-full border border-line bg-surface px-3 shadow-sm',
        'transition-[left] duration-300 ease-[var(--ease-out-soft)]',
        panelOpen ? 'left-[432px]' : 'left-4',
      )}
    >
      <span className="flex items-center gap-2">
        <span className="flex h-7 items-center gap-2 rounded-full border border-line bg-surface px-2 shadow-map">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: high }}
            aria-hidden
          />
          <span className="font-mono text-sm font-semibold">82</span>
        </span>
        <span className="text-xs text-ink-2">
          Skor risiko · makin tinggi makin berbahaya
        </span>
      </span>

      <span className="h-4 w-px bg-line" aria-hidden />

      <span className="flex items-center gap-2">
        <span className="relative size-5" aria-hidden>
          <span
            className="absolute inset-0 rounded-full border"
            style={{
              backgroundColor: withAlpha(high, 0.1),
              borderColor: withAlpha(high, 0.24),
            }}
          />
          <span
            className="absolute inset-1 rounded-full border"
            style={{
              backgroundColor: withAlpha(mid, 0.1),
              borderColor: withAlpha(mid, 0.24),
            }}
          />
        </span>
        <span className="text-xs text-ink-2">
          Ukuran halo = jumlah titik panas
        </span>
      </span>
    </div>
  )
}
