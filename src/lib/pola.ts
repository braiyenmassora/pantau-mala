/**
 * Skala tipografi FE — disiplin satu skala ala Pola Mantap (BE),
 * nilainya dari design-system FE sendiri (§1): body 14/20, kontrol 44px.
 * Pakai konstanta ini untuk judul/isi baru; jangan campur ukuran bebas.
 */
export const T = {
  page: 'text-xl leading-8 font-semibold text-ink',
  section: 'text-ink text-sm leading-5 font-semibold',
  body: 'text-ink text-sm leading-5 font-medium',
  meta: 'text-ink-2 text-xs leading-4 font-medium',
  quiet: 'text-ink-3 text-xs leading-4',
  display: 'font-mono text-3xl leading-10 font-semibold tabular-nums text-ink',
  mono: 'font-mono text-xs leading-4 tabular-nums',
  cta: 'text-sm leading-5 font-semibold',
} as const
