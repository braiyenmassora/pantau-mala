import { useEffect, useRef } from 'react'

import { useLocaleStore } from '@/copy'
import { useRegionCatalog, useRegions } from '@/data/queries'
import { applyHomeMeta, applyWilayahMeta } from '@/lib/page-meta'
import { buildWilayahPath, parseWilayahPath, slugifyWilayah } from '@/lib/wilayah-path'
import { useMapStore } from '@/store/map'
import { useUiStore } from '@/store/ui'

type Pending =
  | { status: 'idle' }
  | { status: 'home' }
  | { status: 'invalid' }
  | { status: 'code'; code: string; slug: string }

/**
 * Sinkron dua arah URL ↔ selectedCode.
 * pushState saat pilih/tutup; replaceState saat normalisasi slug; popstate baca URL.
 */
export function WilayahUrlSync() {
  const locale = useLocaleStore((s) => s.locale)
  const selectedCode = useMapStore((s) => s.selectedCode)
  const wilayahNotFound = useMapStore((s) => s.wilayahNotFound)
  const select = useMapStore((s) => s.select)
  const setWilayahNotFound = useMapStore((s) => s.setWilayahNotFound)
  const setPanelOpen = useUiStore((s) => s.setPanelOpen)
  const { data: regions } = useRegions()
  const { data: catalog, isPending: catalogPending } = useRegionCatalog()

  const applyingFromUrl = useRef(false)
  const pending = useRef<Pending>({ status: 'idle' })
  const bootstrapped = useRef(false)

  function nameFor(code: string): string | null {
    return (
      regions?.find((r) => r.code === code)?.name ??
      catalog?.regencies.find((k) => k.code === code)?.name ??
      null
    )
  }

  function provinceFor(code: string): string | undefined {
    return (
      regions?.find((r) => r.code === code)?.province ??
      catalog?.regencies.find((k) => k.code === code)?.province
    )
  }

  function openCode(code: string, slugFromUrl: string) {
    const name = nameFor(code)
    if (!name) {
      applyingFromUrl.current = true
      setWilayahNotFound(true)
      setPanelOpen(true)
      applyHomeMeta()
      return
    }

    applyingFromUrl.current = true
    select(code, provinceFor(code))
    setPanelOpen(true)

    const canonical = buildWilayahPath(name, code)
    if (!canonical) return

    const expectedSlug = slugifyWilayah(name)
    if (slugFromUrl !== expectedSlug || window.location.pathname !== canonical) {
      window.history.replaceState(null, '', canonical)
    }
    applyWilayahMeta(name, canonical)
  }

  function applyFromLocation() {
    const parsed = parseWilayahPath(window.location.pathname)
    if (parsed.kind === 'home') {
      applyingFromUrl.current = true
      select(null)
      setWilayahNotFound(false)
      applyHomeMeta()
      return
    }
    if (parsed.kind === 'invalid') {
      applyingFromUrl.current = true
      setWilayahNotFound(true)
      setPanelOpen(true)
      applyHomeMeta()
      return
    }
    if (!nameFor(parsed.code) && catalogPending && !catalog) {
      pending.current = { status: 'code', code: parsed.code, slug: parsed.slug }
      return
    }
    openCode(parsed.code, parsed.slug)
  }

  useEffect(() => {
    if (!bootstrapped.current) {
      bootstrapped.current = true
      const parsed = parseWilayahPath(window.location.pathname)
      if (parsed.kind === 'home') pending.current = { status: 'home' }
      else if (parsed.kind === 'invalid') pending.current = { status: 'invalid' }
      else
        pending.current = {
          status: 'code',
          code: parsed.code,
          slug: parsed.slug,
        }
    }

    function onPop() {
      pending.current = { status: 'idle' }
      applyFromLocation()
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const p = pending.current
    if (p.status === 'idle') return
    if (p.status === 'home') {
      pending.current = { status: 'idle' }
      return
    }
    if (p.status === 'invalid') {
      pending.current = { status: 'idle' }
      applyingFromUrl.current = true
      setWilayahNotFound(true)
      setPanelOpen(true)
      applyHomeMeta()
      return
    }
    if (catalogPending && !catalog) return
    pending.current = { status: 'idle' }
    openCode(p.code, p.slug)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog, catalogPending, regions])

  useEffect(() => {
    if (applyingFromUrl.current) {
      applyingFromUrl.current = false
      return
    }

    if (wilayahNotFound && !selectedCode) return

    if (!selectedCode) {
      if (window.location.pathname !== '/') {
        window.history.pushState(null, '', '/')
      }
      applyHomeMeta()
      return
    }

    const name = nameFor(selectedCode)
    if (!name) return
    const path = buildWilayahPath(name, selectedCode)
    if (!path) return
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path)
    }
    applyWilayahMeta(name, path)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCode, wilayahNotFound, regions, catalog, locale])

  return null
}
