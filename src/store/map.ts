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
  select: (code: string | null, regionProvince?: string) => void
  hover: (code: string | null) => void
  setProvince: (province: string) => void
  toggleCategory: (category: RiskCategory) => void
  clearCategories: () => void
  /** Clear search, selection, category filter, and province → home view. */
  resetHome: () => void
  setQuery: (query: string) => void
  setLocation: (location: UserLocation) => void
  setWilayahNotFound: (value: boolean) => void
}

export const useMapStore = create<MapState>((set) => ({
  selectedCode: null,
  hoveredCode: null,
  province: 'Semua',
  selectedCategories: new Set(),
  query: '',
  location: { status: 'off' },
  wilayahNotFound: false,
  select: (selectedCode, regionProvince) =>
    set({
      selectedCode,
      wilayahNotFound: false,
      // Lepas tip hover/flag agar tidak “nempel” setelah Escape / tutup detail.
      hoveredCode: null,
      // Buka detail: kosongkan pencarian agar panel detail tampil bersih
      ...(selectedCode ? { query: '' } : {}),
      ...(regionProvince ? { province: regionProvince } : {}),
    }),
  hover: (hoveredCode) => set({ hoveredCode }),
  setProvince: (province) =>
    set({ province, selectedCode: null, hoveredCode: null, wilayahNotFound: false }),
  /** Single-select: pick one category, or clear if the same chip is clicked again. */
  toggleCategory: (category) =>
    set((s) => {
      if (s.selectedCategories.has(category)) {
        return {
          selectedCategories: new Set(),
          selectedCode: null,
          wilayahNotFound: false,
        }
      }
      return {
        selectedCategories: new Set([category]),
        selectedCode: null,
        wilayahNotFound: false,
      }
    }),
  clearCategories: () =>
    set({ selectedCategories: new Set(), selectedCode: null, wilayahNotFound: false }),
  resetHome: () =>
    set({
      query: '',
      selectedCode: null,
      selectedCategories: new Set(),
      province: 'Semua',
      wilayahNotFound: false,
    }),
  setQuery: (query) => set({ query }),
  setLocation: (location) => set({ location }),
  setWilayahNotFound: (wilayahNotFound) =>
    set({
      wilayahNotFound,
      ...(wilayahNotFound ? { selectedCode: null, hoveredCode: null } : {}),
    }),
}))
