import { focusRing } from '@/components/common/focus-ring'
import { Sparkline } from '@/components/common/sparkline'
import type { CatalogProvince, RiskCategory } from '@/data/types'
import { formatNumber } from '@/lib/format'
import { RISK_CATEGORIES } from '@/lib/risk-category'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/store/map'

export type TopProvinceItem = {
  province: CatalogProvince
  hotspots_24h: number
  risk_category: RiskCategory
  trend_7d?: readonly number[]
}

type TopProvincesListProps = {
  items: TopProvinceItem[]
}

function provinceSparkClass(risk: RiskCategory): string {
  if (risk === 'sangat_tinggi') return 'text-risk-high'
  if (risk === 'sedang') return 'text-risk-mid'
  return 'text-risk-low'
}

/** Baris: titik 8px · nama · sparkline brand · angka mono. */
export function TopProvincesList({ items }: TopProvincesListProps) {
  const setProvince = useMapStore((s) => s.setProvince)
  const setQuery = useMapStore((s) => s.setQuery)

  return (
    <ol className="flex flex-col">
      {items.map((item) => (
        <li key={item.province.code}>
          <button
            type="button"
            className={cn(
              'rounded-ctl flex w-full items-center gap-3 px-2 py-3 text-left',
              'hover:bg-surface-muted transition-colors duration-150',
              focusRing,
            )}
            onClick={() => {
              setProvince(item.province.name)
              setQuery('')
            }}
          >
            <span
              className={cn(
                'size-2 shrink-0 rounded-full',
                RISK_CATEGORIES[item.risk_category].dotClass,
              )}
              aria-hidden
            />
            <span className="text-ink min-w-0 flex-1 truncate text-sm leading-5 font-medium">
              {item.province.name}
            </span>
            {item.trend_7d && item.trend_7d.length >= 2 ? (
              <Sparkline
                data={item.trend_7d}
                width={48}
                height={18}
                className={provinceSparkClass(item.risk_category)}
                ariaLabel={`Tren 7 hari ${item.province.name}`}
              />
            ) : null}
            <span className="text-ink shrink-0 font-mono text-sm leading-5 font-semibold tabular-nums">
              {formatNumber(item.hotspots_24h)}
            </span>
          </button>
        </li>
      ))}
    </ol>
  )
}
