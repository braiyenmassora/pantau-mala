import { create } from 'zustand'

import type { HotspotReportTarget } from '@/data/hotspot-reports'
import { isMobileWidth, isTabletWidth, type MobileSheetLevel } from '@/lib/layout'

type UiState = {
  panelOpen: boolean
  /** Mobile bottom sheet: peek → half (default) → full. Diabaikan di sm+. */
  mobileSheet: MobileSheetLevel
  /** false sampai framing peta + data regions siap — overlay boot AccessGate. */
  bootDone: boolean
  /** Sheet tulis laporan di satu titik. */
  reportTarget: HotspotReportTarget | null
  /** Detail satu laporan warga di side panel. */
  selectedReportId: string | null
  /** Daftar laporan warga berkelompok provinsi › kab/kota. */
  reportsOpen: boolean
  togglePanel: () => void
  setPanelOpen: (open: boolean) => void
  setMobileSheet: (level: MobileSheetLevel) => void
  setBootDone: (done: boolean) => void
  setReportTarget: (target: HotspotReportTarget | null) => void
  setSelectedReportId: (id: string | null) => void
  setReportsOpen: (open: boolean) => void
}

function initialPanelOpen(): boolean {
  // Mobile sheet + desktop panel mulai terbuka (half). Tablet: tertutup agar peta penuh.
  return !isTabletWidth()
}

export const useUiStore = create<UiState>((set) => ({
  panelOpen: initialPanelOpen(),
  mobileSheet: 'half',
  bootDone: false,
  reportTarget: null,
  selectedReportId: null,
  reportsOpen: false,
  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
  setPanelOpen: (panelOpen) =>
    set(() => {
      if (!isMobileWidth()) return { panelOpen }
      // Mobile: "tutup" = peek; buka (detail/select) = half 50/50.
      if (!panelOpen) return { panelOpen: true, mobileSheet: 'peek' }
      return { panelOpen: true, mobileSheet: 'half' }
    }),
  setMobileSheet: (mobileSheet) => set({ mobileSheet, panelOpen: true }),
  setBootDone: (bootDone) => set({ bootDone }),
  setReportTarget: (reportTarget) =>
    set(reportTarget ? { reportTarget, selectedReportId: null } : { reportTarget: null }),
  setSelectedReportId: (selectedReportId) =>
    set(
      selectedReportId
        ? { selectedReportId, reportTarget: null }
        : { selectedReportId: null },
    ),
  setReportsOpen: (reportsOpen) =>
    set(
      reportsOpen
        ? { reportsOpen, selectedReportId: null, reportTarget: null }
        : { reportsOpen: false },
    ),
}))
