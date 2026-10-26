import { create } from 'zustand'

import type { RiskCategory } from '@/data/types'

/** off → requesting (pra-izin) → active | outside | denied | error | timeout */
export type LocationStatus =
  'off' | 'requesting' | 'active' | 'outside' | 'denied' | 'error' | 'timeout'

export type UserLocation = {
  status: LocationStatus
  /** Present when status is active or outside. Not persisted. */
  coords?: { lon: number; lat: number }
}

type MapState = {
  selectedCode: string | null
  hoveredCode: string | null
  /** UI sentinel "Semua" = no province filter. */
  province: string
  selectedCategories: Set<RiskCategory>
  query: string
  location: UserLocation
  /**
   * URL `/wilayah/...` tidak dikenal atau kode tidak ada di katalog.
   * Dipakai untuk empty state, terpisah dari selectedCode.
   */
  wilayahNotFound: boolean
  /**
   * Setelah klik titik di heatmap: buka tip detail + CTA laporan di pin
   * yang `properties.time`-nya cocok. Sekali pakai.
   */
  focusHotspotTime: string | null
  select: (
    code: string | null,
    regionProvince?: string,
    /** Klik titik heatmap → buka tip laporan di pin ini. */
    focusHotspotTime?: string | null,
  ) => void
  hover: (code: string | null) => void
  setProvince: (province: string) => void
  toggleCategory: (category: RiskCategory) => void
  clearCategories: () => void
  /** Clear search, selection, category filter, and province → home view. */
  resetHome: () => void
  setQuery: (query: string) => void
  setLocation: (location: UserLocation) => void
  setWilayahNotFound: (value: boolean) => void
  clearFocusHotspotTime: () => void
}

export const useMapStore = create<MapState>((set) => ({
  selectedCode: null,
  hoveredCode: null,
  province: 'Semua',
  selectedCategories: new Set(),
  query: '',
  location: { status: 'off' },
  wilayahNotFound: false,
  focusHotspotTime: null,
  select: (selectedCode, regionProvince, focusHotspotTime) =>
    set({
      selectedCode,
      wilayahNotFound: false,
      // Lepas tip hover/flag agar tidak “nempel” setelah Escape / tutup detail.
      hoveredCode: null,
      focusHotspotTime: focusHotspotTime ?? null,
      // Buka detail: kosongkan pencarian agar panel detail tampil bersih
      ...(selectedCode ? { query: '' } : {}),
      ...(regionProvince ? { province: regionProvince } : {}),
    }),
  hover: (hoveredCode) => set({ hoveredCode }),
  setProvince: (province) =>
    set({
      province,
      selectedCode: null,
      hoveredCode: null,
      wilayahNotFound: false,
      focusHotspotTime: null,
    }),
  /** Single-select: pick one category, or clear if the same chip is clicked again. */
  toggleCategory: (category) =>
    set((s) => {
      if (s.selectedCategories.has(category)) {
        return {
          selectedCategories: new Set(),
          selectedCode: null,
          wilayahNotFound: false,
          focusHotspotTime: null,
        }
      }
      return {
        selectedCategories: new Set([category]),
        selectedCode: null,
        wilayahNotFound: false,
        focusHotspotTime: null,
      }
    }),
  clearCategories: () =>
    set({
      selectedCategories: new Set(),
      selectedCode: null,
      wilayahNotFound: false,
      focusHotspotTime: null,
    }),
  resetHome: () =>
    set({
      query: '',
      selectedCode: null,
      selectedCategories: new Set(),
      province: 'Semua',
      wilayahNotFound: false,
      focusHotspotTime: null,
    }),
  setQuery: (query) => set({ query }),
  setLocation: (location) => set({ location }),
  setWilayahNotFound: (wilayahNotFound) =>
    set({
      wilayahNotFound,
      ...(wilayahNotFound
        ? { selectedCode: null, hoveredCode: null, focusHotspotTime: null }
        : {}),
    }),
  clearFocusHotspotTime: () => set({ focusHotspotTime: null }),
}))
