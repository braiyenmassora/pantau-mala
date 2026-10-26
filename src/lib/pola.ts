/**
 * Skala tipografi FE — disiplin satu skala ala Pola Mantap (BE),
 * nilainya dari design-system FE sendiri (§1).
 * Pakai konstanta ini untuk judul/isi baru; jangan campur ukuran bebas.
 */
export const T = {
  /** Judul halaman / form di header panel. */
  title: 'text-ink text-sm leading-5 font-semibold',
  page: 'text-xl leading-8 font-semibold text-ink',
  section: 'text-ink text-sm leading-5 font-semibold',
  body: 'text-ink text-sm leading-5 font-medium',
  meta: 'text-ink-2 text-xs leading-4 font-medium',
  fieldLabel: 'text-ink-2 text-xs leading-4 font-medium',
  quiet: 'text-ink-3 text-xs leading-4',
  display: 'font-sans text-3xl leading-10 font-semibold tabular-nums text-ink',
  mono: 'font-sans text-xs leading-4 tabular-nums',
  cta: 'text-sm leading-5 font-semibold',
  /** Warna ikon UI — hijau brand utama. */
  icon: 'text-brand',
} as const

/** Padding / irama shell panel (list, detail, form). */
export const PANEL = {
  pad: 'px-4',
  header: 'pt-3 pb-2',
  footer: 'py-3',
  sectionY: 'py-4',
  /** Sticky header bar — compose + detail/list. */
  stickyHeader: 'border-line bg-surface sticky top-0 z-10 border-b',
  /** Isi scroll di bawah sticky — gap = --section-gap (24). */
  body: 'flex flex-col gap-6 pt-3 pb-6',
} as const

/**
 * Chrome peta / panel / form — satu DNA (8px + border-line + surface),
 * beda peran = beda shadow / field muted. Pin/locate/avatar → rounded-full.
 */
export const CHROME = {
  /** Pin preview / kartu besar di peta. */
  panel: 'rounded-ctl border-line bg-surface text-ink border shadow-panel',
  /** Chip rute, zoom stack, float kecil. */
  mapFloat: 'rounded-ctl border-line bg-surface text-ink border shadow-map',
  /** Trigger filter Provinsi / risiko / topik form. */
  mapFilterTrigger: 'rounded-ctl border-line bg-surface text-ink border shadow-map',
  /** Popover filter / topik — card-like, shadow-panel. */
  mapFilterPopover: 'rounded-ctl border-line bg-surface text-ink border shadow-panel',
  /** Popup / tip UI map generik. */
  popup: 'rounded-ctl border-line bg-surface text-ink border shadow-map',
  /** Shell sidebar desktop (App aside). */
  sidebar: 'rounded-panel border-line bg-surface text-ink border shadow-panel',
  /** Field form di panel — abu hangat, tanpa border. */
  field:
    'bg-surface-muted text-ink rounded-ctl h-11 w-full border-0 px-3 text-sm leading-5 shadow-none outline-none focus-visible:ring-2 focus-visible:ring-brand/40',
  /** CTA utama footer form. */
  ctaPrimary:
    'bg-brand text-surface hover:opacity-95 rounded-ctl inline-flex h-11 min-h-11 items-center justify-center px-4 text-sm leading-5 font-semibold shadow-none',
  /** CTA sekunder / batal. */
  ctaMuted:
    'border-line bg-surface text-ink hover:bg-surface-muted rounded-ctl inline-flex h-11 min-h-11 items-center justify-center border px-4 text-sm leading-5 font-semibold shadow-none',
} as const
