import { focusRing } from '@/components/common/focus-ring'
import { Sparkline } from '@/components/common/sparkline'
import { Card, CardContent } from '@/components/ui/card'
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

// ponytail: tiap provinsi = kartu hasil tipis yang bisa diklik.
export function TopProvincesList({ items }: TopProvincesListProps) {
  const setProvince = useMapStore((s) => s.setProvince)
  const setQuery = useMapStore((s) => s.setQuery)

  return (
    <ol className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.province.code}>
          <Card className="hover:bg-surface-muted transition-colors duration-150">
            <button
              type="button"
              className={cn(
                'flex w-full items-center gap-3 text-left',
                focusRing,
                'rounded-card',
              )}
              onClick={() => {
                setProvince(item.province.name)
                setQuery('')
              }}
            >
              <CardContent className="flex w-full items-center gap-3 py-3">
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
              </CardContent>
            </button>
          </Card>
        </li>
      ))}
    </ol>
  )
}
