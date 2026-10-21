import { create } from 'zustand'

/** ok = brand (sukses), err = risk-high — pola tone Pola Mantap (BE). */
export type ToastTone = 'ok' | 'err'

type ToastState = {
  title: string | null
  description: string | null
  tone: ToastTone
  showToast: (title: string, description?: string, tone?: ToastTone) => void
  dismissToast: () => void
}

export const useToastStore = create<ToastState>((set) => ({
  title: null,
  description: null,
  tone: 'ok',
  showToast: (title, description, tone = 'ok') =>
    set({ title, description: description ?? null, tone }),
  dismissToast: () => set({ title: null, description: null }),
}))
