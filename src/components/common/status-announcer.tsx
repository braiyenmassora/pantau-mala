import { useMemo } from 'react'

import { useDaftarWilayah, useRegions } from '@/data/queries'
import { copy } from '@/copy/id'
import { searchWilayah } from '@/lib/search-wilayah'
import { useMapStore } from '@/store/map'

/** Polite live region for search results, selected region, and active location. */
export function StatusAnnouncer() {
  const query = useMapStore((s) => s.query)
  const selectedCode = useMapStore((s) => s.selectedCode)
  const location = useMapStore((s) => s.location)
  const { data: regions } = useRegions()
  const { data: daftar } = useDaftarWilayah()

  const message = useMemo(() => {
    const parts: string[] = []

    if (selectedCode && regions) {
      const region = regions.find((r) => r.kode === selectedCode)
      if (region) {
        parts.push(`Wilayah dipilih: ${region.nama}`)
      } else if (daftar) {
        const kab = daftar.kabkota.find((k) => k.kode === selectedCode)
        if (kab) parts.push(`Wilayah dipilih: ${kab.nama}`)
      }
    }

    const q = query.trim()
    if (q && daftar && regions && !selectedCode) {
      const hits = searchWilayah(daftar, regions, q)
      const n = hits.provinces.length + hits.kabkota.length
      parts.push(
        n === 0
          ? copy.empty.searchMiss.title
          : `${copy.panel.searchResults}: ${n} lokasi`,
      )
    }

    if (location.status === 'active') {
      parts.push(copy.location.yourLocation)
    }

    return parts.join('. ')
  }, [query, selectedCode, location.status, regions, daftar])

  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </div>
  )
}
