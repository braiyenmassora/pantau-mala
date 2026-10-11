import { RegionPin } from '@/components/map/region-pin'
import type { Region } from '@/data/types'

type RegionLayersProps = {
  regions: Region[]
}

/** Semua pin kab/kota langsung — tanpa cluster angka. */
export function RegionLayers({ regions }: RegionLayersProps) {
  return (
    <>
      {regions.map((region) => (
        <RegionPin key={region.code} region={region} />
      ))}
    </>
  )
}
