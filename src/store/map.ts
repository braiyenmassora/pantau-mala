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
  select: (code: string | null) => void
  hover: (code: string | null) => void
  setProvince: (province: string) => void
  toggleCategory: (category: RiskCategory) => void
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
  select: (selectedCode) => set({ selectedCode }),
  hover: (hoveredCode) => set({ hoveredCode }),
  setProvince: (province) => set({ province, selectedCode: null }),
  toggleCategory: (category) =>
    set((s) => {
      const next = new Set(s.selectedCategories)
      if (next.has(category)) next.delete(category)
      else next.add(category)
      return { selectedCategories: next }
    }),
  setQuery: (query) => set({ query }),
  setLocation: (location) => set({ location }),
}))
