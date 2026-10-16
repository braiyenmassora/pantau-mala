import { create } from 'zustand'

import { isDesktopWidth } from '@/lib/layout'

type UiState = {
  panelOpen: boolean
  /** false sampai framing peta + data regions siap — overlay boot AccessGate. */
  bootDone: boolean
  togglePanel: () => void
  setPanelOpen: (open: boolean) => void
  setBootDone: (done: boolean) => void
}

function initialPanelOpen(): boolean {
  // Desktop saja mulai terbuka; mobile/tablet mulai tertutup agar peta penuh.
  return isDesktopWidth()
}

export const useUiStore = create<UiState>((set) => ({
  panelOpen: initialPanelOpen(),
  bootDone: false,
  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
  setPanelOpen: (panelOpen) => set({ panelOpen }),
  setBootDone: (bootDone) => set({ bootDone }),
}))
