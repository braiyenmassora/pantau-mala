# Design System — pantaumala (portable)

Dokumen **mandiri**. Agen / developer di repo lain boleh meniru sistem ini **hanya dari file ini** — tidak perlu membuka `tokens.css`, komponen, atau path lain di repo asal.

Gunakan nilai di bawah apa adanya. Jangan menebak warna, spacing, atau tipografi di luar daftar ini.

---

## Cara pakai (repo lain)

1. Salin blok **§ Tokens CSS lengkap** ke file theme proyekmu (`tokens.css`, `globals.css`, atau `:root`).
2. Pasang font IBM Plex Sans (400/500/600) + IBM Plex Mono (500/600).
3. Ikuti prinsip visual + resep komponen di dokumen ini.
4. Untuk canvas / MapLibre / SVG, pakai konstanta hex di **§ Hex untuk Map / canvas**.
5. Jangan menambah hex baru sebelum ada alasan kuat; utamakan token yang sudah ada.

**Stack asal (opsional):** React + Tailwind CSS v4 `@theme` + Lucide. Nilai token tetap valid sebagai CSS variables di stack lain.

---

## 1. Karakter & prinsip visual

UI monitoring GIS light-mode: permukaan putih mengambang di atas latar netral, tipografi padat terbaca, brand hijau hanya untuk aksi — bukan untuk data risiko.

| # | Prinsip | Aturan konkret |
| --- | --- | --- |
| 1 | Map / canvas first, chrome soft | Surface `#ffffff`, border 1px `#e8eaed`, shadow soft `0 1px 2px rgba(0,0,0,0.06)` |
| 2 | Brand ≠ data | Brand `#137333` = CTA, fokus, seleksi, lokasi. Risiko pakai palet risk-* |
| 3 | Densitas terbaca | Body 14/20 · label/meta 12/16 · display angka 32/40 mono. Minimum 12px |
| 4 | Touch target | Kontrol utama 44×44 (`h-11` / `size-11`) |
| 5 | Light only | `color-scheme: light`. Jangan invent dark mode dari dokumen ini |
| 6 | Motion lembut | 150–300ms, easing `cubic-bezier(0.2, 0.7, 0.2, 1)`; hormati `prefers-reduced-motion` |

### Hierarki tipografi

| Level | Ukuran | Weight | Warna | Contoh |
| --- | --- | --- | --- | --- |
| Display angka | 32 / 40 | 600 mono | `#1f2328` | Count, magnitudo |
| Judul halaman | 24 / 32 | 600 | `#1f2328` | Judul beranda panel |
| Judul section / entity | 14 / 20 | 600 | `#1f2328` | Nama wilayah di kartu |
| Body / list | 14 / 20 | 500 | `#1f2328` | Nama baris daftar |
| Label kartu | 12 / 16 | 500 | `#5f6368` | Judul kecil di atas nilai |
| Meta / caption | 12 / 16 | 400–500 | `#5f6368` | Waktu, catatan, legend |
| Placeholder | 14 / 20 | 400 | `#757575` | Search, select kosong |

---

## 2. Tokens CSS lengkap (salin utuh)

Blok berikut adalah **sumber kebenaran nilai**. Cocok untuk Tailwind v4 `@theme` atau diadaptasi ke `:root`.

```css
/* pantaumala design tokens — portable copy
   Font: IBM Plex Sans 400/500/600 + IBM Plex Mono 500/600 */

@theme {
  --font-sans: 'IBM Plex Sans', system-ui, sans-serif;
  --font-mono: 'IBM Plex Mono', ui-monospace, monospace;

  /* Netral — ink-2 / ink-3 lolos AA 4.5:1 di atas surface */
  --color-ink: #1f2328;
  --color-ink-2: #5f6368;
  --color-ink-3: #757575;
  --color-line: #e8eaed;
  --color-surface: #ffffff;
  --color-surface-muted: #f8f9fa;
  --color-map-bg: #e8eaed;
  --color-scrollbar: #dadce0;
  --color-chart: #5f6368;
  --color-chart-soft: #dadce0;

  /* Brand — hanya aksi / fokus / seleksi, BUKAN data */
  --color-brand: #137333;
  --color-brand-soft: #e6f4ea;
  --color-brand-mala: #d93025;
  --color-focus: #137333;
  --color-location: #137333;
  --color-location-tint: #e6f4ea;

  /* Risiko — label teks wajib, jangan andalkan warna saja */
  --color-risk-high: #d93025;
  --color-risk-high-tint: #fce8e6;
  --color-risk-high-text: #c5221f;
  --color-risk-mid: #f29900;
  --color-risk-mid-tint: #fef7e0;
  --color-risk-mid-text: #854800;
  --color-risk-low: #188038;
  --color-risk-low-tint: #e6f4ea;
  --color-risk-low-text: #137333;
  /* Belum dinilai (di proyek asal ada di TS; ikutkan di sini agar portable) */
  --color-risk-na: #80868b;
  --color-risk-na-tint: #f1f3f4;
  --color-risk-na-text: #5f6368;

  /* Heatmap kepadatan — kuning → oranye → merah */
  --color-heat-low: #ffe08a;
  --color-heat-mid: #f29900;
  --color-heat-high: #d93025;

  /* Spacing 4px */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 16px; /* legacy alias → 16; hindari pakai baru */
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* Layout chrome GIS (opsional; sesuaikan produkmu) */
  --floating-control-offset: 16px;
  --map-panel-width: 400px;
  --map-panel-edge: 416px;
  --map-overlay-inset: 432px;
  --map-controls-clearance: 88px;
  --card-padding: 16px;
  --card-gap: 16px;
  --section-gap: 24px;
  --content-gap: 16px;
  --control-height-sm: 40px;
  --control-height-md: 44px;
  --control-height-lg: 48px;

  /* Tipografi: 12 / 14 / 16 / 24 / 32 — minimum 12 */
  --text-xs: 12px;
  --text-xs--line-height: 16px;
  --text-sm: 14px;
  --text-sm--line-height: 20px;
  --text-base: 14px;
  --text-base--line-height: 20px;
  --text-paragraph: 14px;
  --text-paragraph--line-height: 20px;
  --text-lg: 16px;
  --text-lg--line-height: 24px;
  --text-xl: 24px;
  --text-xl--line-height: 32px;
  --text-3xl: 32px;
  --text-3xl--line-height: 40px;

  /* Radius: 8 kontrol soft · 12 kartu/panel */
  --radius-ctl: 8px;
  --radius-card: 12px;
  --radius-panel: 12px;
  --radius-pill: 8px;

  /* Shadow */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.06);
  --shadow-chrome: 0 1px 2px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 2px 6px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 2px 6px rgba(0, 0, 0, 0.08);
  --shadow-map: 0 2px 6px rgba(0, 0, 0, 0.08);
  --shadow-pin-active: 0 2px 8px rgba(31, 35, 40, 0.2);

  /* Motion */
  --duration-fast: 150ms;
  --duration-base: 220ms;
  --duration-slow: 300ms;
  --ease-out-soft: cubic-bezier(0.2, 0.7, 0.2, 1);
}

@layer base {
  html {
    color-scheme: light;
  }
  body {
    font-family: var(--font-sans);
    color: var(--color-ink);
    background: var(--color-map-bg);
    font-size: 14px;
    line-height: 20px;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation: none !important;
    transition: none !important;
    scroll-behavior: auto !important;
  }
}
```

### Alternatif `:root` (tanpa Tailwind `@theme`)

Jika tidak memakai Tailwind v4, salin variabel yang sama ke `:root { … }` dan gunakan `var(--color-brand)` dll. di CSS/komponen.

### Bridge shadcn / semantic UI (opsional)

```css
:root {
  --background: #ffffff;
  --foreground: #1f2328;
  --card: #ffffff;
  --card-foreground: #1f2328;
  --popover: #ffffff;
  --popover-foreground: #1f2328;
  --primary: #137333;
  --primary-foreground: #ffffff;
  --secondary: #e6f4ea;
  --secondary-foreground: #137333;
  --muted: #f8f9fa;
  --muted-foreground: #5f6368;
  --accent: #f8f9fa;
  --accent-foreground: #1f2328;
  /* Error UI ≠ warna risiko data */
  --destructive: #1f2328;
  --border: #e8eaed;
  --input: #e8eaed;
  --ring: #137333;
  --radius: 12px;
  --chart-1: #d93025;
  --chart-2: #f29900;
  --chart-3: #188038;
  --chart-4: #137333;
  --chart-5: #5f6368;
}
```

### Utility Tailwind yang diharapkan (setelah `@theme`)

| Token | Contoh class |
| --- | --- |
| `--color-brand` | `bg-brand` `text-brand` `ring-brand` `border-brand` |
| `--color-ink` / `-2` / `-3` | `text-ink` `text-ink-2` `text-ink-3` |
| `--color-surface` / `-muted` | `bg-surface` `bg-surface-muted` |
| `--color-line` | `border-line` |
| `--color-map-bg` | `bg-map-bg` |
| `--radius-ctl` / `card` / `panel` | `rounded-ctl` `rounded-card` `rounded-panel` |
| `--shadow-chrome` / `map` | `shadow-chrome` `shadow-map` |
| `--ease-out-soft` | `ease-out-soft` |

Tanpa Tailwind: pakai `var(--…)` langsung.

---

## 3. Indeks token (nilai + fungsi)

### Warna

| Token | Value | Fungsi |
| --- | --- | --- |
| `--color-ink` | `#1f2328` | Teks utama |
| `--color-ink-2` | `#5f6368` | Teks sekunder / meta |
| `--color-ink-3` | `#757575` | Placeholder / ikon muted |
| `--color-line` | `#e8eaed` | Border, divider, track progress |
| `--color-surface` | `#ffffff` | Kartu, panel, chrome |
| `--color-surface-muted` | `#f8f9fa` | Hover, empty info, tile soft |
| `--color-map-bg` | `#e8eaed` | Latar app / di luar surface |
| `--color-scrollbar` | `#dadce0` | Thumb scrollbar tipis |
| `--color-chart` | `#5f6368` | Grafik netral (bukan risiko) |
| `--color-chart-soft` | `#dadce0` | Soft chart |
| `--color-brand` | `#137333` | CTA, fokus, seleksi, lokasi |
| `--color-brand-soft` | `#e6f4ea` | Fill soft brand |
| `--color-brand-mala` | `#d93025` | Aksen nama (sama hue risk-high) |
| `--color-focus` | `#137333` | Alias fokus (= brand) |
| `--color-location` | `#137333` | Lokasi user (= brand) |
| `--color-location-tint` | `#e6f4ea` | Tint lokasi |
| `--color-risk-high` | `#d93025` | Risiko sangat tinggi |
| `--color-risk-high-tint` | `#fce8e6` | Badge / tint high |
| `--color-risk-high-text` | `#c5221f` | Teks badge high |
| `--color-risk-mid` | `#f29900` | Risiko sedang / aksen gempa |
| `--color-risk-mid-tint` | `#fef7e0` | Badge tint mid |
| `--color-risk-mid-text` | `#854800` | Teks badge mid |
| `--color-risk-low` | `#188038` | Risiko rendah |
| `--color-risk-low-tint` | `#e6f4ea` | Badge tint low |
| `--color-risk-low-text` | `#137333` | Teks badge low |
| `--color-risk-na` | `#80868b` | Belum dinilai (dot) |
| `--color-risk-na-tint` | `#f1f3f4` | Belum dinilai (bg) |
| `--color-risk-na-text` | `#5f6368` | Belum dinilai (teks) |
| `--color-heat-low` | `#ffe08a` | Heatmap jarang |
| `--color-heat-mid` | `#f29900` | Heatmap sedang |
| `--color-heat-high` | `#d93025` | Heatmap padat |

**Aturan:** error form / destructive UI memakai **ink** (`#1f2328`), bukan risk-high. Risiko data ≠ error UI.

### Tipografi

| Token | Size | Line-height |
| --- | --- | --- |
| `--text-xs` | 12px | 16px |
| `--text-sm` / `--text-base` / `--text-paragraph` | 14px | 20px |
| `--text-lg` | 16px | 24px |
| `--text-xl` | 24px | 32px |
| `--text-3xl` | 32px | 40px |
| `--font-sans` | IBM Plex Sans, system-ui, sans-serif | |
| `--font-mono` | IBM Plex Mono, ui-monospace, monospace | |

Weight yang dipakai: **400** body, **500** label/list, **600** judul/button/angka.

### Spacing

| Token | px |
| --- | --- |
| `--space-1` | 4 |
| `--space-2` | 8 |
| `--space-3` | 12 |
| `--space-4` | 16 |
| `--space-6` | 24 |
| `--space-8` | 32 |
| `--space-10` | 40 |
| `--space-12` | 48 |
| `--space-16` | 64 |

Pola umum: padding kartu **16**, gap konten **16**, gap section **24**, gutter mengambang **16**.

### Radius & shadow

| Token | Value | Pakai untuk |
| --- | --- | --- |
| `--radius-ctl` | 8px | Badge, tip/chrome mengambang, tombol ikon, popover |
| `--radius-card` | 12px | Kartu, chip filter, tombol app, search |
| `--radius-panel` | 12px | Shell panel / login card |
| `--shadow-chrome` | `0 1px 2px rgba(0,0,0,0.06)` | Panel, chip, kontrol peta, tip |
| `--shadow-map` | `0 2px 6px rgba(0,0,0,0.08)` | Elevasi lebih kuat / pin |
| `--shadow-pin-active` | `0 2px 8px rgba(31,35,40,0.2)` | Pin aktif |
| Kartu panel konten | **tanpa shadow** | Hanya border |

### Motion

| Token | Value |
| --- | --- |
| `--duration-fast` | 150ms |
| `--duration-base` | 220ms |
| `--duration-slow` | 300ms |
| `--ease-out-soft` | `cubic-bezier(0.2, 0.7, 0.2, 1)` |
| Map flyTo (JS) | 600ms; `0` jika reduced-motion |

### Layout GIS (opsional)

| Token / konstanta | Value |
| --- | --- |
| Gutter / floating offset | 16px |
| Lebar panel | 400px |
| Tepi panel (gutter+width) | 416px |
| Overlay inset (panel terbuka, desktop) | 432px |
| Clearance kontrol kanan | 88px |
| Tinggi kontrol | 40 / **44** / 48 |
| Map min width (tablet + panel) | 280px |

```ts
// Portable layout constants (mirror tokens di atas)
export const BREAKPOINT = { sm: 640, lg: 1024 } as const
export const LAYOUT = {
  gutter: 16,
  panelWidth: 400,
  panelEdge: 416,
  overlayInset: 432,
  controlsClearance: 88,
  controlSize: 44,
  mapMinWidth: 280,
} as const
```

**Breakpoint:** mobile `<640` · tablet `640–1023` · desktop `≥1024`.

---

## 4. Hex untuk Map / canvas (salin ke TS)

Jangan hardcode hex di JSX UI — pakai class/token. Untuk MapLibre / canvas / SVG:

```ts
export const BRAND_HEX = '#137333'
export const LOCATION_HEX = '#137333'
export const LINE_HEX = '#E8EAED'
export const INK_HEX = '#1F2328'
export const SURFACE_HEX = '#FFFFFF'

export const RISK = {
  high: { dot: '#D93025', tint: '#FCE8E6', text: '#C5221F', label: 'Sangat tinggi' },
  mid: { dot: '#F29900', tint: '#FEF7E0', text: '#854800', label: 'Sedang' },
  low: { dot: '#188038', tint: '#E6F4EA', text: '#137333', label: 'Rendah' },
  na: { dot: '#80868B', tint: '#F1F3F4', text: '#5F6368', label: 'Belum dinilai' },
} as const

export const HEATMAP = {
  low: '#FFE08A',
  mid: '#F29900',
  high: '#D93025',
  transparent: 'rgba(0,0,0,0)',
} as const

export const PIN_ACTIVE_BOX_SHADOW = '0 2px 8px rgba(31, 35, 40, 0.2)'
```

Gradient legend kepadatan:

```css
background: linear-gradient(
  90deg,
  var(--color-heat-low),
  var(--color-heat-mid),
  var(--color-heat-high)
);
```

---

## 5. Resep komponen (nilai lengkap di dokumen)

Semua class di bawah mengasumsikan token §2 sudah terpasang. Tanpa Tailwind, terjemahkan ke CSS dengan nilai hex/px dari tabel.

### Focus ring (wajib untuk kontrol interaktif)

```
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-brand
focus-visible:ring-offset-2
```

String siap pakai:

```ts
export const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2'
```

### Chrome surface (tip, search shell, dialog mengambang)

Pola: radius **8** + border line + shadow chrome (bukan radius kartu 12 tanpa shadow).

```
rounded-ctl border border-line bg-surface text-ink shadow-chrome
```

```ts
export const chromeSurface =
  'rounded-ctl border-line bg-surface text-ink border shadow-chrome'
```

### Button (produk)

| Spec | Nilai |
| --- | --- |
| Tinggi | 44px (`h-11 min-h-11`) |
| Radius | 12px (`rounded-card`) |
| Type | 14/20 · weight 600 |
| Gap ikon | 8px (`gap-2`) |
| Transisi | 150ms colors/opacity/transform |

| Variant | Classes |
| --- | --- |
| primary | `bg-brand text-surface hover:opacity-95 active:translate-y-px` |
| secondary | `border border-line bg-surface text-ink hover:bg-surface-muted` |
| soft | `border border-brand/20 bg-brand-soft text-brand hover:bg-brand-soft/80` |
| ghost | `bg-transparent text-ink-2 hover:bg-surface-muted hover:text-ink` |
| disabled/loading | `opacity-50 cursor-not-allowed` + spinner 16px |

Padding: `sm` → `px-3`; `md` → `px-4`.

### Chip (filter)

```
inline-flex h-11 min-h-11 items-center gap-2
rounded-card border border-line bg-surface text-ink shadow-chrome
px-3 text-sm leading-5 font-medium
transition 150ms + ease-out-soft
hover:bg-surface-muted
+ focusRing
```

Pressed: `border-brand/30 bg-brand-soft text-brand`.  
Disabled / count 0: `opacity-40 pointer-events-none`.

Dot risiko di dalam chip: `size-2 rounded-full` + warna risk.

### Badge

Base:

```
inline-flex h-6 shrink-0 items-center rounded-ctl px-2
text-xs leading-4 font-semibold
```

| Variant | Classes |
| --- | --- |
| meta | `bg-surface text-ink-2 shadow-sm` |
| risk high | `bg-risk-high-tint text-risk-high-text` |
| risk mid | `bg-risk-mid-tint text-risk-mid-text` |
| risk low | `bg-risk-low-tint text-risk-low-text` |
| risk na | `bg-surface-muted text-ink-2` (atau `bg-risk-na-tint text-risk-na-text`) |

Selalu tampilkan **label teks**, bukan warna saja.

### Card (panel konten)

Anatomi: **label 12 · nilai · meta 12 · aksi opsional**.  
Padding 16 · radius 12 · putih + border · **tanpa shadow**.

```
Root:    border border-line bg-surface text-ink rounded-card flex flex-col
Header:  flex items-center justify-between gap-2 px-4 pt-4
Title:   text-ink-2 text-xs leading-4 font-medium
Desc:    text-ink-2 text-xs leading-4
Content: px-4 pt-2 pb-4   (+ space-y-3 di dalam)
Footer:  flex items-center px-4 pb-4
```

Display value di dalam kartu:

```
text-ink font-mono text-3xl leading-10 font-semibold tabular-nums
```

Kartu interaktif (klik seluruh kartu): tambah `hover:bg-surface-muted cursor-pointer`, `role="button"`, keyboard Enter/Space, + `focusRing`.

### Kartu tip peta / info mengambang

```
chromeSurface + relative z-30 w-max max-w-[min(280px,70vw)] px-4 py-3
Judul: text-ink text-sm leading-5 font-semibold
Meta:  text-ink-2 text-xs leading-4
Stack: flex flex-col gap-1
```

### Search field

Shell tinggi **48px** (`h-12`), `chromeSurface` + `rounded-card`, `gap-3 px-3`.  
Focus-within: `border-brand`; ikon search ikut `text-brand`.  
Input: borderless, `text-sm leading-5`, placeholder `text-ink-3`.  
Tombol clear: `size-8` (32) di dalam field 48.

### Empty state

```
Section: rounded-card p-4
  info → bg-surface-muted
  action → border border-line bg-surface
Icon well: size-8 rounded-ctl bg-brand-soft text-brand  (ikon 16px stroke 2)
Title: text-ink text-sm leading-5 font-semibold
Body:  text-ink-2 mt-2 text-xs leading-4
CTA:   Button variant soft
```

### List row (wilayah / ranking)

```
button w-full flex items-center gap-3 px-2 py-3 rounded-ctl text-left
hover/active: bg-surface-muted
+ focusRing

[dot 8px] [nama truncate text-sm font-medium] [spark opsional] [angka mono text-sm font-semibold]
```

Alternatif dengan leading 40×40: `min-h-16 px-3 py-2 gap-3`; meta di bawah judul `text-xs text-ink-2`.

### Map control stack

```
Container: rounded-ctl border border-line bg-surface shadow-chrome divide-y divide-line overflow-hidden
Button:    size-11 text-ink-2 hover:bg-surface-muted hover:text-ink + focusRing
Pressed:   bg-brand-soft text-brand
Icon:      size-4 strokeWidth 2
```

### Progress / skeleton / loading

| Elemen | Spec |
| --- | --- |
| Progress track | `h-1 w-full rounded-full bg-line` |
| Progress bar | `bg-brand` sepertiga lebar, animasi indeterminate 1.5s |
| Skeleton | `rounded-card bg-surface-muted animate-pulse` |
| Boot overlay | fullscreen `bg-map-bg`, spinner brand 32px, caption `text-xs text-ink-2` |

### Tooltip

```
rounded-ctl border border-line bg-surface text-ink shadow-chrome
px-3 py-1.5 (atau p-3 untuk info panjang)
text-xs leading-4 max-w ~240–320px
```

Tombol info ikon-only: hit area **44×44**, ikon 14px (`size-3.5`), stroke **1.75**.

### Login / form padat

```
Card: max-w-sm rounded-panel bg-surface p-6 shadow-sm space-y-6
Field: h-11 rounded-card border border-line px-3 text-sm
Submit: h-11 w-full rounded-card bg-brand text-surface font-semibold
```

---

## 6. Komposisi kartu (pola siap tiru)

```
┌──────────────────────────────────────┐
│ Label 12/16 · ink-2 · 500     [Badge]│  ← header
│                                      │
│  1.234          ← 32 mono / 600 ink  │
│  Satuan / nama  ← 14 / 400–600 ink   │
│  Meta baris…    ← 12 / ink-2         │
└──────────────────────────────────────┘
   border #e8eaed · radius 12 · no shadow · padding ~16
```

Stack antar-kartu / section: **gap 24px**; antar-elemen dalam kartu: **gap 12–16px** (`space-y-3`).

Dua keluarga radius:

| Keluarga | Radius | Shadow | Contoh |
| --- | --- | --- | --- |
| Panel content card | 12 | tidak | Metrik, detail, empty |
| Floating chrome | 8 | chrome soft | Tip pin, popover, kontrol |

---

## 7. Ikon & aset

| Aturan | Nilai |
| --- | --- |
| Library contoh | Lucide (outlined) |
| Stroke default | **2** |
| Stroke kompak | **1.75** (info, tab tipis, filter) |
| Ukuran umum | 14 (`size-3.5`) · 16 (`size-4`) · 32 (`size-8` spinner/empty) |
| Ikon dekoratif | `aria-hidden` |
| Ikon-only | wajib `aria-label` |
| Gap ikon–teks | 8px (`gap-2`) |

Brand (jika meniru identitas yang sama): simbol mata + wordmark; compact symbol 28px / wordmark tinggi 20px.

---

## 8. Interaction & state

| State | Perilaku |
| --- | --- |
| Hover baris / ghost | `bg-surface-muted` |
| Hover primary | `opacity-95` |
| Active primary | `translate-y-px` |
| Pressed chip / locate | `bg-brand-soft` + `text-brand` |
| Disabled | `opacity-50` (filter kosong `opacity-40`) |
| Focus | ring brand 2px + offset 2px |
| Loading | spinner / progress / skeleton |
| Reduced motion | matikan animasi & set duration map ke 0 |

Z-index panduan: map `0` · sticky `10` · chrome peta `30` · panel `40` · dialog/popover `50` · boot `100`.

---

## 9. Responsive

| Viewport | Lebar | Perilaku tipikal |
| --- | --- | --- |
| Mobile | `< 640` | Panel hampir full (`100vw - 32`); chrome peta disembunyikan saat panel terbuka; map `inert` |
| Tablet | `640–1023` | Panel max 400 tapi sisakan map ≥ 280; overlay left di-clamp |
| Desktop | `≥ 1024` | Overlay left = 432 saat panel terbuka |

Breakpoint internal opsional (bukan token global): `360px` (grid 2 kolom), `380px` (CTA sejajar di kartu), `720px` avail-width (chip → menu).

---

## 10. Aksesibilitas (pola yang harus digandakan)

- Focus-visible ring brand di semua kontrol kustom.
- Target sentuh utama ≥ 44×44.
- Warna risiko selalu disertai **teks label**.
- `aria-label` / `aria-pressed` / `aria-expanded` / `aria-busy` sesuai peran.
- Hormati `prefers-reduced-motion`.
- Error UI: teks ink + `role="alert"` — bukan merah risiko.

---

## 11. Aturan wajib untuk AI agent (termasuk repo lain)

1. Baca dokumen ini dulu; anggap lengkap — jangan mengarang token di luar daftar.
2. Salin token §2 sebelum membangun UI baru.
3. Pakai semantic token / class dari indeks §3, bukan hex mentah di JSX (kecuali Map/canvas §4).
4. Brand hijau hanya untuk aksi/fokus/lokasi; data risiko pakai risk-*.
5. Ikuti anatomi kartu §6 dan resep §5.
6. Pertahankan light-mode, IBM Plex, radius 8/12, shadow soft.
7. Jangan buat varian button/chip/card baru jika resep yang ada sudah cocok.
8. Jangan ubah token global demi satu komponen.
9. Token baru hanya jika nilai berulang & bermakna; dokumentasikan di file design system repo tujuan.
10. Jangan klaim ada komponen/token yang tidak ada di dokumen atau di kode repo tujuan.
11. Minimum font 12px; kontrol utama 44px.
12. Destructive/error ≠ risk-high.
13. Saat meniru di repo lain: sesuaikan nama produk/copy, tapi **pertahankan nilai visual** jika tujuannya “seperti pantaumala”.
14. Jika repo tujuan sudah punya design system berbeda, jangan campur tanpa keputusan eksplisit.
15. Setelah token dipasang di repo tujuan, file design system di repo itu menjadi SSOT lokal (boleh fork dari dokumen ini).

### Anti-pattern

- Purple gradient / glass berat / dark mode spekulatif  
- Shadow di setiap kartu panel  
- Hardcode `#137333` di className UI  
- Type &lt; 12px  
- Touch target kecil untuk kontrol peta utama  
- Warna brand untuk encoding severity data  

---

## 12. Cheat sheet cepat

```
Latar app          #e8eaed
Surface            #ffffff
Border             #e8eaed
Teks               #1f2328 / #5f6368 / #757575
Brand              #137333  soft #e6f4ea
Risk high/mid/low  #d93025 / #f29900 / #188038
Body               14/20 Sans
Label              12/16 ink-2
Display            32/40 Mono 600
Radius             8 chrome · 12 card
Shadow chrome      0 1px 2px rgba(0,0,0,0.06)
Kontrol            44px
Section gap        24px
Card pad           16px
Motion             150–300ms · cubic-bezier(0.2, 0.7, 0.2, 1)
Breakpoints        640 / 1024
```

---

## 13. Keyframes yang sering dipakai (opsional)

```css
@keyframes indeterminate {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}
@keyframes view-in {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: none; }
}
@keyframes halo-pulse {
  0% { transform: scale(0.85); opacity: 0.58; }
  100% { transform: scale(1.52); opacity: 0; }
}

.animate-indeterminate {
  animation: indeterminate 1.5s var(--ease-out-soft) infinite;
}
```

---

## Asal & status

Diekstrak dari implementasi UI pantaumala (audit source). Nilai di §2–§5 adalah yang dipakai di produk; token `risk-na` dan `shadow-pin-active` disertakan di blok portable agar repo lain tidak perlu file TS terpisah.

Dokumen ini sengaja **self-contained** untuk dijadikan referensi lintas-repo.
