import { useQuery } from '@tanstack/react-query'

import { getCopy } from '@/copy'
import {
  decodeProvinceBoundaries,
  provinceBoundaryManifestSchema,
} from '@/lib/province-boundaries'

export async function fetchProvinceBoundaries(signal?: AbortSignal) {
  const manifestResponse = await fetch('/data/indonesia-provinces.meta.json', { signal })
  if (!manifestResponse.ok) throw new Error(getCopy().errors.provinceMetaFailed)
  const manifest = provinceBoundaryManifestSchema.parse(await manifestResponse.json())
  const geometryResponse = await fetch(manifest.geometry, { signal })
  if (!geometryResponse.ok) throw new Error(getCopy().errors.provinceGeometryFailed)
  const text = await geometryResponse.text()
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  const hash = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')
  if (hash !== manifest.geometry_sha256)
    throw new Error(getCopy().errors.provinceHashMismatch)
  const geometry = decodeProvinceBoundaries(JSON.parse(text), manifest)
  return { ...manifest, geometry }
}

export function useProvinceBoundaries() {
  return useQuery({
    queryKey: ['province-boundaries', 1],
    queryFn: ({ signal }) => fetchProvinceBoundaries(signal),
    staleTime: Infinity,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  })
}
