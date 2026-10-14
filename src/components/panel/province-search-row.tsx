import { Map as MapIcon } from 'lucide-react'
import type { RefObject } from 'react'

import { ListRow } from '@/components/common/list-row'
import { RiskMarker } from '@/components/common/risk-marker'
import type { MapRef } from '@/components/ui/map'
import { copy } from '@/copy/id'
import type { CatalogProvince, RiskCategory } from '@/data/types'
import { formatNumber } from '@/lib/format'
import { effectiveRiskCategory } from '@/lib/risk-rule'
import { useMapStore } from '@/store/map'

type ProvinceSearchRowProps = {
  province: CatalogProvince
  hotspotCount: number
  /** Tetap di props untuk pemanggil; kamera di ProvinceFocus. */
  mapRef: RefObject<MapRef | null>
  /** `wilayah` = jumlah kab (search); `titik` = Σ hotspots_24h (top provinsi). */
  countKind?: 'wilayah' | 'titik'
  /** Samakan marker risiko dengan pin peta (top 5). */
  riskCategory?: RiskCategory
}

export function ProvinceSearchRow({
  province,
  hotspotCount,
  mapRef: _mapRef,
  countKind = 'wilayah',
  riskCategory,
}: ProvinceSearchRowProps) {
  void _mapRef
  const setProvince = useMapStore((s) => s.setProvince)
  const setQuery = useMapStore((s) => s.setQuery)
  const countLabel = formatNumber(hotspotCount)
  const meta =
    hotspotCount <= 0
      ? copy.search.noHotspots
      : countKind === 'titik'
        ? copy.map.regionMetaHotspots(countLabel)
        : copy.search.withHotspots(countLabel)
  // Top list: nama saja (seperti pin). Search: "Provinsi …".
  const title =
    countKind === 'titik' ? province.name : copy.search.provinceTitle(province.name)

  const effectiveRisk: RiskCategory =
    riskCategory && riskCategory !== 'tidak_tersedia'
      ? riskCategory
      : effectiveRiskCategory({
          risk_category: 'tidak_tersedia',
          hotspots_24h: hotspotCount,
        })

  return (
    <ListRow
      leading={
        effectiveRisk !== 'tidak_tersedia' ? (
          <RiskMarker kategori={effectiveRisk} />
        ) : (
          <span
            className="bg-brand-soft text-brand flex size-10 items-center justify-center rounded-full"
            aria-hidden
          >
            <MapIcon className="size-4" strokeWidth={2} />
          </span>
        )
      }
      title={title}
      meta={meta}
      onClick={() => {
        // Zoom hanya lewat ProvinceFocus — hindari double fitBounds + moveend race.
        setProvince(province.name)
        setQuery('')
      }}
    />
  )
}
