import { create } from 'zustand'

type UiState = {
  panelOpen: boolean
  togglePanel: () => void
  setPanelOpen: (open: boolean) => void
}

function initialPanelOpen(): boolean {
  if (typeof window === 'undefined') return true
  // Below desktop MVP width, start closed so minZoom stays higher.
  return window.innerWidth >= 1024
}

export const useUiStore = create<UiState>((set) => ({
  panelOpen: initialPanelOpen(),
  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
  setPanelOpen: (panelOpen) => set({ panelOpen }),
}))
