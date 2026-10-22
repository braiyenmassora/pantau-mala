import { useMemo } from 'react'

import { useRegionCatalog, useRegions } from '@/data/queries'
import { getCopy } from '@/copy'
import { searchWilayah } from '@/lib/search-wilayah'
import { useMapStore } from '@/store/map'

/** Polite live region for search results, selected region, and active location. */
export function StatusAnnouncer() {
  const query = useMapStore((s) => s.query)
  const selectedCode = useMapStore((s) => s.selectedCode)
  const location = useMapStore((s) => s.location)
  const { data: regions } = useRegions()
  const { data: daftar } = useRegionCatalog()

  const message = useMemo(() => {
    const parts: string[] = []

    if (selectedCode && regions) {
      const region = regions.find((r) => r.code === selectedCode)
      if (region) {
        parts.push(getCopy().a11y.regionSelected(region.name))
      } else if (daftar) {
        const kab = daftar.regencies.find((k) => k.code === selectedCode)
        if (kab) parts.push(getCopy().a11y.regionSelected(kab.name))
      }
    }

    const q = query.trim()
    if (q && daftar && regions && !selectedCode) {
      const hits = searchWilayah(daftar, regions, q)
      const n = hits.provinces.length + hits.kabkota.length
      parts.push(
        n === 0 ? getCopy().empty.searchMiss.title : getCopy().a11y.searchHits(n),
      )
    }

    if (location.status === 'active') {
      parts.push(getCopy().location.yourLocation)
    } else if (location.status === 'outside') {
      parts.push(getCopy().location.outsideTitle)
    }

    return parts.join('. ')
  }, [query, selectedCode, location.status, regions, daftar])

  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </div>
  )
}
