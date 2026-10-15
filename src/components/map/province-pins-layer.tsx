import { useMemo, useState } from 'react'

import { ProvincePin } from '@/components/map/province-pin'
import { useRegionCatalog } from '@/data/queries'
import type { Region } from '@/data/types'
import { aggregateByProvince } from '@/lib/province-aggregates'
import { useMapStore } from '@/store/map'

type ProvincePinsLayerProps = {
  regions: Region[]
}

// ponytail: level nasional — beat summary merah/kuning tanpa angka di pusat tiap provinsi.
export function ProvincePinsLayer({ regions }: ProvincePinsLayerProps) {
  const { data: catalog } = useRegionCatalog()
  const province = useMapStore((s) => s.province)
  const selectedCode = useMapStore((s) => s.selectedCode)
  const [hoveredName, setHoveredName] = useState<string | null>(null)

  const isNational = province === 'Semua' && !selectedCode

  const aggregates = useMemo(() => {
    if (!isNational || !catalog) return []
    return aggregateByProvince(regions, catalog.provinces)
  }, [isNational, catalog, regions])

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
