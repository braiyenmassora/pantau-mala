/**
 * Tes UI memakai copy ID. Tanpa ini, guessLocale di jsdom (TZ UTC) jadi EN
 * dan assertion terhadap copy/id.ts gagal.
 */
try {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('pantau-mala-locale', 'id')
  }
} catch {
  // ignore
}
