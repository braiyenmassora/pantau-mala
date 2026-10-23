import { create } from 'zustand'

import type { HotspotReportTarget } from '@/data/hotspot-reports'
import { isTabletWidth } from '@/lib/layout'

type UiState = {
  panelOpen: boolean
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
  setBootDone: (done: boolean) => void
  setReportTarget: (target: HotspotReportTarget | null) => void
  setSelectedReportId: (id: string | null) => void
  setReportsOpen: (open: boolean) => void
}

function initialPanelOpen(): boolean {
  // Mobile sheet + desktop panel mulai terbuka (Maps-style). Tablet: tertutup agar peta penuh.
  return !isTabletWidth()
}

export const useUiStore = create<UiState>((set) => ({
  panelOpen: initialPanelOpen(),
  bootDone: false,
  reportTarget: null,
  selectedReportId: null,
  reportsOpen: false,
  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
  setPanelOpen: (panelOpen) => set({ panelOpen }),
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
