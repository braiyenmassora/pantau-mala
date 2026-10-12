# pantau-mala — design system (FE MVP)

|                  |                                           |
| ---------------- | ----------------------------------------- |
| **Versi**        | 1.0 — 11 Oktober 2026                     |
| **Sumber token** | `src/styles/tokens.css`                   |
| **Copy / ikon**  | [`fe-ui-copy.md`](fe-ui-copy.md)          |
| **Kontrak data** | [`prd-fe.md`](prd-fe.md) — jangan bentrok |

Satu sistem visual untuk peta, panel, empty, error. Jangan menambah palet di luar file token.

---

## 1. Prinsip

1. Peta = hero; panel = informasi. Satu pekerjaan per section.
2. Warna risiko hanya untuk pin / chip / legend status — bukan dekorasi.
3. Titik panas ≠ kebakaran (lihat fe-ui-copy).
4. Hindari look generik AI: ungu glow, cream+terracotta default, pill cluster, multi-shadow, stat strip.

---

## 2. Warna (CSS variables)

| Token                                                          | Peran                                       |
| -------------------------------------------------------------- | ------------------------------------------- |
| `--color-surface` / `--color-surface-muted` / `--color-map-bg` | Latar                                       |
| `--color-ink` / `--color-ink-2` / `--color-ink-3`              | Teks / muted / disabled                     |
| `--color-line`                                                 | Border                                      |
| `--color-brand` / `--color-brand-soft`                         | Aksen UI (bukan risiko)                     |
| `--color-risk-mid*`                                            | Risiko **sedang**                           |
| `--color-risk-high*`                                           | Risiko **sangat tinggi**                    |
| `--color-risk-low*`                                            | Cadangan (MVP pin rendah tidak dikirim API) |

Focus: `--color-focus` (= brand); ring via `ring-brand` + offset (`focus-ring`).

Hex MapLibre: `src/lib/risk-category.ts` harus mirror token.

---

## 3. Spacing (skala 4px)

Hanya: **4, 8, 12, 16, 24, 32** (Tailwind `1 / 2 / 3 / 4 / 6 / 8`).

| Ritme               | Nilai   |
| ------------------- | ------- |
| Dalam komponen      | 8 / 12  |
| Antar section       | 16 / 24 |
| Margin peta overlay | 16      |

Jangan magical number (13px, 22px, `pt-5` = 20, `gap-2.5` = 10).

Touch target kontrol utama: **min 40px** (`size-10`); utamakan **44px** (`size-11` / `h-11`) untuk kontrol peta.

---

## 4. Radius & bayangan

| Token                 | Pakai               |
| --------------------- | ------------------- |
| `--radius-ctl` (8)    | Kontrol, chip, menu |
| `--radius-card` (12)  | Kartu, list row     |
| `--radius-panel` (16) | Panel, dialog       |

Bayangan: **`shadow-sm`** default UI; `shadow-map` hanya pin peta. Hindari menumpuk `shadow-lg` kecuali dialog.

---

## 5. Tipografi

| Family        | Pakai            |
| ------------- | ---------------- |
| IBM Plex Sans | UI               |
| IBM Plex Mono | Angka besar saja |

| Peran           | Token                    | Catatan         |
| --------------- | ------------------------ | --------------- |
| Caption / badge | `text-xs` (12/16)        |                 |
| Small / chip    | `text-sm` (12/16)        | selaras skala 4 |
| Body            | `text-base` (14/20)      |                 |
| Prose           | `text-paragraph` (14/22) | summary API     |
| Title           | `text-lg` / `text-xl`    |                 |
| Angka hero      | `text-3xl` + mono        |                 |

Sentence case. Hindari ALL CAPS kecuali singkatan (WIB, PM2.5, FWI).

---

## 6. Ikon

- Library: **Lucide**, stroke **2**.
- Inline + ⓘ: **16px** (`size-4`).
- Tombol ikon peta: **20px** (`size-5`) dalam hit area 40–44px.
- Flame = titik panas / risiko (bukan “kebakaran aktif”).
- ⓘ = komponen `HintButton` saja.

---

## 7. Motion

- Easing: `--ease-out-soft`.
- Halo pin: `--animate-halo-mid` / `--animate-halo-high`.
- Hormati `prefers-reduced-motion` (sudah di tokens).

---

## 8. Checklist layar

- [ ] Spacing hanya skala 4
- [ ] Warna risiko tidak dipakai dekorasi
- [ ] Copy dari kamus fe-ui-copy; summary/actions dari API apa adanya
- [ ] Tidak ada tren 7 hari / sparkline
- [ ] ⓘ = HintButton, 1–2 kalimat
- [ ] Mobile: teks terbaca; kontrol mudah di-tap

---

_FE design system v1.0 — token terpusat di `tokens.css`._

## Integrasi Go — override branch12Okt2026

Typography/palette/components tetap memakai token existing IBM Plex. AccessGate adalah form center max-w-sm dengan labels, eye icon44px, focus ring dan input16px di mobile. Account/session controls memperlihatkan workspace dari server; tidak menyediakan selector role. Proyek Go/API tetap di repo backend terpisah.

Panel mobile memakai lebar viewport minus32px (margin16px), rail toggle berada dalam viewport. Pada panelmobile terbuka, map inert dan kontrolmap/legend yang tertutup tidak focusable. Filter bar mengalir di panel mobile dan kembali overlay desktop. Padding map mobile tidak memakai432px desktop.

State tidak_tersedia memakai warna netral existing, tidak pulse/warna risiko. Skor/calibration/timestamp dan data tambahan memakai DataTile, SectionLabel, details/summary dan tabel compact. Nilai null = —, bukan0; FWI absent dijelaskan belum tersedia. SourceDataPanel dan RegionHistoryPanel lazily request data; semua state mengikuti client/generation. Tidak menambah font/palet baru.

Override copy/count-only Python: Go kategori/score tetap sumber kebenaran, provincepin memilih kategori server tertinggi dari wilayah dalam filter; tidak mengklasifikasi ulang jumlah. Freshness mencantumkan targetperjam, bukan klaim cron aktif. Validasi browser akhir pada320/360/390/1366, keyboard/reducedmotion/loading/error/overflow diberikan ke owner sesuai instruksi berhenti automation; belum diklaim selesai.

## Identitas bersama CMS Go

Brand menggunakan salinan identik `api/brand-symbol.svg` dan `api/brand-wordmark.svg` dari backend. Komponen Brand digunakan pada login dan footer panel: simbol dekoratif, lettering bernama pantau mala, proporsi asli dan gap8px. Favicon memakai simbol yang sama; apple-touch-icon180px dan Open Graph1200×630 dirasterisasi dari SVG sumber, tanpa font untuk lettering. Warna di SVG dan theme-color merupakan pengecualian statis brand CMS, bukan palet komponen baru. Verifikasi browser/mobile akhir tetap manual oleh owner.

## Mode client melalui server env

Peta modeclient langsung terbuka setelah identitas reader terverifikasi. Footer hanya menunjukkan workspace, tanpa logout/switch/username. Kegagalan key/service memakai cardbrand+teksstatus dan tombol Coba lagi, tanpa formpassword. Modeaccount lama hanya optional; server tetap menegakkan scope/client. Pemeriksaan viewport/browser tetap manual oleh owner.
