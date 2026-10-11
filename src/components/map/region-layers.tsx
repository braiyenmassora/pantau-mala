import { useMemo } from 'react'

import { ProvincePin } from '@/components/map/province-pin'
import { RegionPin } from '@/components/map/region-pin'
import { useRegionCatalog } from '@/data/queries'
import type { Region } from '@/data/types'
import { aggregateByProvince } from '@/lib/province-aggregates'
import { useMapStore } from '@/store/map'

type RegionLayersProps = {
  regions: Region[]
}

/**
 * Overview nasional: pin total per provinsi.
 * Drill-in / list: pin kab (nama + beat) — titik individual di SelectedHotspotsLayer.
 */
export function RegionLayers({ regions }: RegionLayersProps) {
  const province = useMapStore((s) => s.province)
  const selectedCode = useMapStore((s) => s.selectedCode)
  const selectedCategories = useMapStore((s) => s.selectedCategories)
  const { data: catalog } = useRegionCatalog()

  const aggregates = useMemo(() => {
    if (!catalog || province !== 'Semua' || selectedCode) return []
    // Chip tunggal: warna pin = filter, bukan Σ→risk (hindari merah palsu).
    const pinRisk = selectedCategories.size === 1 ? [...selectedCategories][0] : undefined
    return aggregateByProvince(regions, catalog.provinces, { pinRisk })
  }, [catalog, regions, province, selectedCode, selectedCategories])

  if (province === 'Semua' && !selectedCode) {
    return (
      <>
        {aggregates.map((a) => (
          <ProvincePin key={a.name} aggregate={a} />
        ))}
      </>
    )
  }

  // Kab terpilih dari overview: satu pin + flag.
  // Drill-in provinsi: semua pin kab di filter (nama/tooltip + beat).
  const pins =
    selectedCode && province === 'Semua'
      ? regions.filter((r) => r.code === selectedCode)
      : regions

  return (
    <>
      {pins.map((region) => (
        <RegionPin key={region.code} region={region} />
      ))}
    </>
  )
}
