import { useMemo, useState } from 'react'

import { ProvincePin } from '@/components/map/province-pin'
import { useRegionCatalog } from '@/data/queries'
import type { Region } from '@/data/types'
import { aggregateByProvince, provinceLabelAnchors } from '@/lib/province-aggregates'
import { useMapStore } from '@/store/map'

type ProvincePinsLayerProps = {
  regions: Region[]
}

// ponytail: level nasional — beat summary merah/kuning tanpa angka di pusat tiap provinsi.
export function ProvincePinsLayer({ regions }: ProvincePinsLayerProps) {
  const { data: catalog } = useRegionCatalog()
  const province = useMapStore((s) => s.province)
  const selectedCode = useMapStore((s) => s.selectedCode)
  const selectedCategories = useMapStore((s) => s.selectedCategories)
  const [hoveredName, setHoveredName] = useState<string | null>(null)

  const isNational = province === 'Semua' && !selectedCode
  const pinRisk =
    selectedCategories.size === 1 ? [...selectedCategories][0] : undefined

  const aggregates = useMemo(() => {
    if (!isNational || !catalog) return []
    return aggregateByProvince(
      regions,
      provinceLabelAnchors(catalog, regions),
      pinRisk ? { pinRisk } : undefined,
    )
  }, [isNational, catalog, regions, pinRisk])

  if (!isNational || aggregates.length === 0) return null

  return (
    <>
      {aggregates.map((agg) => (
        <ProvincePin
          key={agg.name}
          aggregate={agg}
          hovered={hoveredName === agg.name}
          onHover={setHoveredName}
        />
      ))}
    </>
  )
}
