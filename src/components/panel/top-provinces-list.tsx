import type { CatalogProvince } from '@/data/types'
import { copy } from '@/copy/id'
import { formatNumber } from '@/lib/format'
import { focusRing } from '@/components/common/focus-ring'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'

export type TopProvinceItem = {
  province: CatalogProvince
  hotspots_24h: number
}

type TopProvincesListProps = {
  items: TopProvinceItem[]
}

/** Daftar bernomor 1–5 — nama kiri, angka kanan (tanpa ulang "titik panas"). */
export function TopProvincesList({ items }: TopProvincesListProps) {
  const setProvince = useMapStore((s) => s.setProvince)
  const setQuery = useMapStore((s) => s.setQuery)

  return (
    <div>
      <div className="text-ink-2 mb-2 flex items-center justify-between gap-3 text-xs font-medium">
        <span className="sr-only">{copy.search.provinces}</span>
        <span aria-hidden className="flex-1" />
        <span>{copy.panel.topRiskColumn}</span>
      </div>
      <ol className="flex flex-col">
        {items.map((item, index) => (
          <li key={item.province.code}>
            <button
              type="button"
              className={cn(
                'rounded-card hover:bg-surface-muted flex w-full items-center gap-3 px-2 py-2.5 text-left',
                'transition-colors duration-150',
                focusRing,
              )}
              onClick={() => {
                setProvince(item.province.name)
                setQuery('')
              }}
            >
              <span className="text-ink-3 w-5 shrink-0 text-sm tabular-nums">
                {index + 1}.
              </span>
              <span className="text-ink min-w-0 flex-1 truncate text-base font-semibold">
                {item.province.name}
              </span>
              <span className="text-ink font-mono shrink-0 text-base font-semibold tabular-nums">
                {formatNumber(item.hotspots_24h)}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}
