import { create } from 'zustand'

import { copy as idCopy } from './id'
import { enCopy } from './en'

export type Locale = 'id' | 'en'
export type Copy = typeof idCopy

const STORAGE_KEY = 'pantau-mala-locale'

const copies: Record<Locale, Copy> = { id: idCopy, en: enCopy }

function initialLocale(): Locale {
  if (typeof window === 'undefined') return 'id'
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved === 'id' || saved === 'en') return saved
  } catch {
    // shortcut: storage may be blocked (privacy mode) — fall through to browser language.
  }
  // Default stays Indonesian; English only when the user picks it (and it is saved).
  return 'id'
}

type LocaleState = {
  locale: Locale
  setLocale: (locale: Locale) => void
}

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: initialLocale(),
  setLocale: (locale) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, locale)
    } catch {
      // shortcut: ignore blocked storage; locale still applies for this session.
    }
    document.documentElement.lang = locale
    set({ locale })
  },
}))

/** Reactive copy for components — re-renders when the locale changes. */
export function useCopy(): Copy {
  return copies[useLocaleStore((s) => s.locale)]
}

/** Copy for non-component helpers called during render/effects. */
export function getCopy(): Copy {
  return copies[useLocaleStore.getState().locale]
}

export function getLocale(): Locale {
  return useLocaleStore.getState().locale
}
