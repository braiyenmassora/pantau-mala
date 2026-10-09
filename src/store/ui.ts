import { create } from 'zustand'

type UiState = {
  panelOpen: boolean
  togglePanel: () => void
}

export const useUiStore = create<UiState>((set) => ({
  panelOpen: true,
  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
}))
