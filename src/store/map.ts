import { create } from 'zustand'

import type { RiskCategory } from '@/data/types'
import type { Earthquake } from '@/data/extended-contract'

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
  showTemperature: boolean
  showEarthquakes: boolean
  earthquakeKind: 'latest' | 'felt' | 'm5'
  earthquakeFocus: { event: Earthquake; sequence: number } | null
  windLocation: { lon: number; lat: number; label: string } | null
  windTime: number | null
  toggleWind: () => void
  toggleTemperature: () => void
  toggleEarthquakes: () => void
  setEarthquakeKind: (kind: 'latest' | 'felt' | 'm5') => void
  focusEarthquake: (event: Earthquake) => void
  setWindLocation: (location: { lon: number; lat: number; label: string }) => void
  setWindTime: (timestamp: number | null) => void
  select: (code: string | null, regionProvince?: string) => void
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
  showTemperature: false,
  showEarthquakes: true,
  earthquakeKind: 'latest',
  earthquakeFocus: null,
  windLocation: null,
  windTime: null,
  toggleWind: () => set((s) => ({ showWind: !s.showWind })),
  toggleTemperature: () => set((s) => ({ showTemperature: !s.showTemperature })),
  toggleEarthquakes: () => set((s) => ({ showEarthquakes: !s.showEarthquakes })),
  setEarthquakeKind: (earthquakeKind) => set({ earthquakeKind, earthquakeFocus: null }),
  focusEarthquake: (event) =>
    set((state) => ({
      showEarthquakes: true,
      earthquakeFocus: { event, sequence: (state.earthquakeFocus?.sequence ?? 0) + 1 },
    })),
  setWindLocation: (windLocation) => set({ windLocation, windTime: null }),
  setWindTime: (windTime) => set({ windTime }),
  select: (selectedCode, regionProvince) =>
    set({
      selectedCode,
      // Buka detail: kosongkan pencarian agar panel detail tampil bersih
      ...(selectedCode ? { query: '' } : {}),
      ...(regionProvince ? { province: regionProvince } : {}),
    }),
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
