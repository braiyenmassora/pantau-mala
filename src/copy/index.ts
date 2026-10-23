import { create } from 'zustand'

import { copy as idCopy } from './id'
import { enCopy } from './en'

export type Locale = 'id' | 'en'
export type Copy = typeof idCopy

export const STORAGE_KEY = 'pantau-mala-locale'

const copies: Record<Locale, Copy> = { id: idCopy, en: enCopy }

/** Zona waktu Indonesia (tanpa izin lokasi / IP). */
const ID_TIMEZONES = new Set([
  'Asia/Jakarta',
  'Asia/Pontianak',
  'Asia/Makassar',
  'Asia/Jayapura',
])

/**
 * Default bahasa: Indonesia → id, luar → en.
 * Dipakai hanya jika user belum pernah memilih (belum ada localStorage).
 */
export function guessLocale(
  timeZone = safeTimeZone(),
  languages = safeLanguages(),
): Locale {
  if (timeZone && ID_TIMEZONES.has(timeZone)) return 'id'
  for (const lang of languages) {
    if (lang.toLowerCase().startsWith('id')) return 'id'
  }
  return 'en'
}

function safeTimeZone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return undefined
  }
}

function safeLanguages(): readonly string[] {
  try {
    if (typeof navigator === 'undefined') return []
    if (navigator.languages?.length) return navigator.languages
    if (navigator.language) return [navigator.language]
  } catch {
    // ignore
  }
  return []
}

function initialLocale(): Locale {
  if (typeof window === 'undefined') return 'id'
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved === 'id' || saved === 'en') return saved
  } catch {
    // shortcut: storage blocked — fall through to guess.
  }
  return guessLocale()
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
