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

export type ReportHotspot = {
  lat: number
  lon: number
  time: string
  frpMw: number
  satellite: string
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
  /** Event time restored from a shared BMKG link until its feed is loaded. */
  sharedEarthquakeTime: string | null
  windLocation: { lon: number; lat: number; label: string } | null
  windTime: number | null
  reportHotspot: ReportHotspot | null
  toggleWind: () => void
  toggleTemperature: () => void
  toggleEarthquakes: () => void
  setEarthquakeKind: (kind: 'latest' | 'felt' | 'm5') => void
  focusEarthquake: (event: Earthquake) => void
  setSharedEarthquakeTime: (time: string | null) => void
  setWindLocation: (location: { lon: number; lat: number; label: string }) => void
  setWindTime: (timestamp: number | null) => void
  selectHotspot: (code: string, province: string, hotspot: ReportHotspot) => void
  setReportHotspot: (hotspot: ReportHotspot | null) => void
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
  sharedEarthquakeTime: null,
  windLocation: null,
  windTime: null,
  reportHotspot: null,
  toggleWind: () => set((s) => ({ showWind: !s.showWind })),
  toggleTemperature: () => set((s) => ({ showTemperature: !s.showTemperature })),
  toggleEarthquakes: () => set((s) => ({ showEarthquakes: !s.showEarthquakes })),
  setEarthquakeKind: (earthquakeKind) =>
    set({ earthquakeKind, earthquakeFocus: null, sharedEarthquakeTime: null }),
  focusEarthquake: (event) =>
    set((state) => ({
      showEarthquakes: true,
      sharedEarthquakeTime: null,
      earthquakeFocus: { event, sequence: (state.earthquakeFocus?.sequence ?? 0) + 1 },
    })),
  setSharedEarthquakeTime: (sharedEarthquakeTime) => set({ sharedEarthquakeTime }),
  setWindLocation: (windLocation) => set({ windLocation, windTime: null }),
  setWindTime: (windTime) => set({ windTime }),
  selectHotspot: (selectedCode, province, reportHotspot) =>
    set({ selectedCode, province, reportHotspot, query: '', earthquakeFocus: null, sharedEarthquakeTime: null }),
  setReportHotspot: (reportHotspot) => set({ reportHotspot }),
  select: (selectedCode, regionProvince) =>
    set({
      selectedCode,
      reportHotspot: null,
      earthquakeFocus: null,
      sharedEarthquakeTime: null,
      // Buka detail: kosongkan pencarian agar panel detail tampil bersih
      ...(selectedCode ? { query: '' } : {}),
      ...(regionProvince ? { province: regionProvince } : {}),
    }),
  hover: (hoveredCode) => set({ hoveredCode }),
  setProvince: (province) => set({ province, selectedCode: null, reportHotspot: null, earthquakeFocus: null, sharedEarthquakeTime: null }),
  /** Single-select: pick one category, or clear if the same chip is clicked again. */
  toggleCategory: (category) =>
    set((s) => {
      if (s.selectedCategories.has(category)) {
        return { selectedCategories: new Set(), selectedCode: null, reportHotspot: null, earthquakeFocus: null, sharedEarthquakeTime: null }
      }
      return {
        selectedCategories: new Set([category]),
        selectedCode: null,
        reportHotspot: null,
        earthquakeFocus: null,
        sharedEarthquakeTime: null,
      }
    }),
  clearCategories: () =>
    set({ selectedCategories: new Set(), selectedCode: null, reportHotspot: null }),
  resetHome: () =>
    set({
      query: '',
      selectedCode: null,
      reportHotspot: null,
      earthquakeFocus: null,
      sharedEarthquakeTime: null,
      selectedCategories: new Set(),
      province: 'Semua',
    }),
  setQuery: (query) => set({ query }),
  setLocation: (location) => set({ location }),
}))
