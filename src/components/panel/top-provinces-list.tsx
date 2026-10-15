import { focusRing } from '@/components/common/focus-ring'
import { Sparkline } from '@/components/common/sparkline'
import type { CatalogProvince } from '@/data/types'
import { formatNumber } from '@/lib/format'
import { RISK_CATEGORIES } from '@/lib/risk-category'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'

export type TopProvinceItem = {
  province: CatalogProvince
  hotspots_24h: number
  trend_7d?: readonly number[]
}

type TopProvincesListProps = {
  items: TopProvinceItem[]
}

function provinceRiskDot(hotspots: number): string {
  if (hotspots >= 10) return RISK_CATEGORIES.sangat_tinggi.dot
  if (hotspots >= 1) return RISK_CATEGORIES.sedang.dot
  return RISK_CATEGORIES.rendah.dot
}

export function TopProvincesList({ items }: TopProvincesListProps) {
  const setProvince = useMapStore((s) => s.setProvince)
  const setQuery = useMapStore((s) => s.setQuery)

  return (
    <ol className="border-line bg-surface divide-line rounded-card divide-y overflow-hidden border">
      {items.map((item) => (
        <li key={item.province.code}>
          <button
            type="button"
            className={cn(
              'hover:bg-surface-muted flex min-h-10 w-full items-center gap-3 px-3 py-2 text-left transition-colors duration-150 max-sm:min-h-11',
              focusRing,
              'focus-visible:ring-offset-0 focus-visible:ring-inset',
            )}
            onClick={() => {
              setProvince(item.province.name)
              setQuery('')
            }}
          >
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: provinceRiskDot(item.hotspots_24h) }}
              aria-hidden
            />
            <span className="text-ink min-w-0 flex-1 truncate text-sm leading-5 font-medium">
              {item.province.name}
            </span>
            {item.trend_7d ? (
              <Sparkline
                data={item.trend_7d}
                height={16}
                width={36}
                className="shrink-0 opacity-35"
              />
            ) : null}
            <span className="text-ink shrink-0 text-sm leading-5 font-semibold tabular-nums">
              {formatNumber(item.hotspots_24h)}
            </span>
          </button>
        </li>
      ))}
    </ol>
  )
}
