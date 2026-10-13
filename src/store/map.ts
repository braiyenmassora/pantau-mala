import { create } from 'zustand'

import type { RiskCategory } from '@/data/types'

/** off → requesting (pra-izin) → active | denied | error */
export type LocationStatus = 'off' | 'requesting' | 'active' | 'denied' | 'error'

export type UserLocation = {
  status: LocationStatus
  /** Present only when status is active. Not persisted. */
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
  showWind: boolean
  toggleWind: () => void
  select: (code: string | null) => void
  hover: (code: string | null) => void
  setProvince: (province: string) => void
  toggleCategory: (category: RiskCategory) => void
  clearCategories: () => void
  /** Clear search, selection, category filter, and province → home view. */
  resetHome: () => void
  setQuery: (query: string) => void
  setLocation: (location: UserLocation) => void
}

export const useMapStore = create<MapState>((set) => ({
  selectedCode: null,
  hoveredCode: null,
  province: 'Semua',
  selectedCategories: new Set(),
  query: '',
  location: { status: 'off' },
  showWind: false,
  toggleWind: () => set((s) => ({ showWind: !s.showWind })),
  select: (selectedCode) => set({ selectedCode }),
  hover: (hoveredCode) => set({ hoveredCode }),
  setProvince: (province) => set({ province, selectedCode: null }),
  /** Single-select: pick one category, or clear if the same chip is clicked again. */
  toggleCategory: (category) =>
    set((s) => {
      if (s.selectedCategories.has(category)) {
        return { selectedCategories: new Set(), selectedCode: null }
      }
      return { selectedCategories: new Set([category]), selectedCode: null }
    }),
  clearCategories: () => set({ selectedCategories: new Set(), selectedCode: null }),
  resetHome: () =>
    set({
      query: '',
      selectedCode: null,
      selectedCategories: new Set(),
      province: 'Semua',
    }),
  setQuery: (query) => set({ query }),
  setLocation: (location) => set({ location }),
}))
