# Spesifikasi UI – forever-young (MVP)

Acuan desain untuk developer. Light mode saja, grid 4 px, seluruh teks UI berbahasa Indonesia.
Stack: Vite + React + TypeScript + Tailwind CSS + shadcn/ui + mapcn (MapLibre).
Token yang sama tersedia sebagai kode di `src/styles/tokens.css`.

## 1. Warna

| Token | Hex | Dipakai untuk |
| --- | --- | --- |
| `text-primary` | `#14261B` | Teks utama, latar elemen aktif (pin/chip terpilih) |
| `text-secondary` | `#52645A` | Label, teks sekunder, ikon |
| `text-disabled` | `#7A8A80` | Placeholder |
| `border` | `#E3E9E4` | Semua garis dan pembatas |
| `surface` | `#FFFFFF` | Panel, kartu aksi, chip |
| `surface-muted` | `#F6F8F6` | Kartu info, tile, hover |
| `map-bg` | `#DCE7EC` | Latar peta saat tile belum termuat |
| `brand` | `#1E6B45` | Tombol primer, lokasi pengguna, ikon centang, tautan |
| `brand-soft` | `#EDF4EF` | Tombol lembut, badge Beta, lingkaran ikon |

Satu warna aksen saja (hijau brand). **Tidak ada biru.**
Teks sekunder di atas latar `ink` (mis. angka di chip terpilih) = `surface` 70%.

**Kategori risiko** (dot / tint / text):

| Kategori | Skor | Dot | Tint (latar badge) | Text di atas tint | Halo di peta |
| --- | --- | --- | --- | --- | --- |
| Sangat tinggi | 67–100 | `#C2410C` | `#F8D7D0` | `#8E2414` | Ya, pulse 2,6 dtk |
| Sedang | 34–66 | `#D99A0B` | `#FBF0CF` | `#6B4E00` | Ya, pulse 3,4 dtk (lebih pelan) |
| Rendah | 0–33 | `#2E8B57` | `#E4F0E8` | `#1E5A3A` | Tidak |

Halo: isi warna dot 10%, garis 24%, cincin pulse 35%. Ukuran halo = 48 + 3 × jumlah titik panas (px).

## 2. Tipografi

Font: **IBM Plex Sans** untuk semua teks, **IBM Plex Mono** untuk skor, jumlah, koordinat, FRP.
Hanya 6 ukuran (12, 13, 14, 16, 20, 28). Tidak ada teks huruf kapital semua.

| Token | Ukuran / line-height / bobot | Contoh |
| --- | --- | --- |
| `number-lg` | Mono 28 / 32 / 600, letter-spacing −0,02em | Total titik panas, skor di kartu risiko |
| `title-lg` | 20 / 28 / 600 | Nama wilayah, judul panel |
| `title` | 16 / 24 / 600 | Nilai di tile, judul kartu blok |
| `body` / `body-strong` | 14 / 20 / 400, 600 | Teks utama, nama wilayah di daftar |
| `paragraph` | 14 / 22 / 400 | Ringkasan risiko |
| `section-label` | 13 / 18 / 600, `text-secondary` | Judul bagian: "Kondisi saat ini" |
| `small` / `small-strong` | 13 / 18 / 400, 600 | Info sekunder |
| `chip` | 13 / 18 / 500 | Chip filter, dropdown |
| `button` | 13–14 / 18–20 / 600 | Semua tombol |
| `caption` | 12 / 16 / 400 | Waktu, atribusi data |
| `label` | 12 / 16 / 500 | Label tile dan kartu |
| `badge` | 12 / 16 / 600 | Badge kategori, Beta |

## 3. Spasi, radius, bayangan

- **Spasi** kelipatan 4: 4, 8, 12, 16, 20, 24.
  - Padding panel 16 · jarak antar-bagian 24 · judul bagian ke isinya 8 · antar-tile 8
  - Ikon ⓘ di belakang teks berjarak 4; ikon di depan teks berjarak 8
  - Antarbaris teks bertumpuk 4 · elemen ke tepi layar 16
- **Radius**: 8 (kontrol peta, item menu) · 12 (kartu, tile) · 16 (panel, dialog) · 999 (pill).
- **Bayangan**:
  - `sm` `0 1px 3px rgba(20,38,27,.16)` – chip, kontrol, search box
  - `md` `0 4px 16px rgba(20,38,27,.12)` – panel
  - `lg` `0 8px 28px rgba(20,38,27,.18)` – dialog, menu dropdown
  - `map` `0 1px 3px rgba(20,38,27,.24)` – pin, cluster, titik lokasi
- **Ikon**: lucide, garis 2 px; ukuran 14 (ⓘ, panah tab panel), 16 (inline), 18 (aksi), 20 (kontrol peta, ikon kartu).

## 4. Pola kartu

| Pola | Gaya | Dipakai di |
| --- | --- | --- |
| Kartu info | `surface-muted`, tanpa garis, padding 16, radius 12 | Titik panas 24 jam, "Yang bisa kamu lakukan", pesan izin ditolak, "Di sekitar kamu" (aktif) |
| Tile data | `surface-muted`, padding 12, radius 12; ikon 16 + `label`, nilai `title` + satuan `caption` abu | "Kondisi saat ini", 2 tile "Di sekitar kamu" |
| Kartu aksi | `surface`, garis `border`, padding 16, radius 12 | "Risiko di sekitar kamu" (pra-izin) |
| Kartu status | Latar tint kategori, padding 16 | Kartu risiko di detail wilayah |

## 5. Komponen

**Search box** – tinggi 48, pill, garis + bayangan `sm`, logo bulat 32, ikon aksi 40 (ikon cari berubah jadi × saat ada isi atau wilayah dipilih), teks 14.

**Chip kategori** – tinggi 36, padding 12/14, gap 8, dot 8, teks `chip`, angka Mono.
- Default: tidak ada chip terpilih = semua kategori tampil.
- Klik = pilih (bisa lebih dari satu) → hanya kategori terpilih yang tampil. Klik lagi = batal.
- Terpilih: latar `#14261B`, teks putih, dot diberi cincin putih 1,5 px (sama dengan pin aktif).
- Chip = kontrol (latar putih), badge = status (latar tint).

**Dropdown provinsi** – chip yang sama + ikon peta + panah 16 (berputar 180° saat terbuka). Bukan `<select>` bawaan (pakai shadcn Popover + Command atau Select).
Menu: kartu putih, radius 12, bayangan `lg`, padding 4, item 36 px radius 8; terpilih = `surface-muted` + teks 600 + centang hijau.

**Badge** – tinggi 24, padding 10, teks `badge`, latar tint + text kategori. Badge "Beta" memakai `brand-soft` + `brand`.

**Tombol** – semua pill, teks 600.
- Besar 40 (teks 14), kecil 36 (teks 13).
- Primer: `brand`, teks putih. Sekunder: putih bergaris, teks `text-primary`. Lembut: `brand-soft`, teks `brand`.

**Fokus keyboard** – cincin 2 px `brand`, offset 2, hanya `focus-visible` (bukan saat klik mouse saja).

**Pin peta** – tinggi 28, pill putih bergaris, dot 8 + skor Mono 13. Hover/terpilih: latar gelap, teks putih, nama wilayah ikut tampil, skala 1,1.

**Cluster** – lingkaran 40 + 6 × jumlah (px), garis putih 3, warna = kategori tertinggi, cincin 6 px warna kategori 18–20%. Klik = zoom in.

**Baris wilayah (daftar)** – tinggi min 64, padding 12/8, cincin skor 40 (garis 3 warna kategori), nama `body-strong`, provinsi + jumlah `small`, sparkline 56×20 + label tren (↑ naik / ↓ turun / → stabil). Hover = `surface-muted`.

**Kartu risiko (detail)** – latar tint kategori. Kiri: label "Risiko kebakaran" + ⓘ, kategori `title-lg`. Kanan: skor `number-lg` + "/100". Bawah: skala 6 px (hijau/kuning/merah, celah 2 px) + penanda bulat 12 px + label Rendah · Sedang · Sangat tinggi.

**Kontrol peta** – kanan bawah: lokasi saya, zoom +/−, masing-masing 40×40, radius 8, gap 8.

**Keterangan peta** – pill 36 kiri bawah: contoh pin "82" + "Skor risiko · makin tinggi makin berbahaya" | halo merah+kuning + "Ukuran halo = jumlah titik panas".

**Lokasi pengguna** – titik `brand` 16 px, pinggir putih 3 px, aura 40 px 16%. Radius 25 km: garis putus-putus 1 px `brand` 40%, isi 4%, label "Radius 25 km".

## 6. Tata letak

Desain dibuat untuk lebar **1440 × 900** dan tetap rapi mulai lebar **1024 px**. Tampilan mobile belum termasuk MVP.

### 6.1 Wireframe

```
┌───────────────────────────────────────────────────────────────────────────────┐
│16                                                                              │
│  ┌──────────────────────┐  [Provinsi ▾] [● Sangat tinggi 2] [● Sedang 3] ...   │ ← chip, top 16
│  │ (logo) Cari ...   ⌕  │                                                      │
│  │──────────────────────│                                                      │
│  │ Judul panel    Beta  │                                                      │
│  │                      │                     PETA (layar penuh)               │
│  │ [kartu / tile]       │                                                      │
│  │                      │▐  ← tab 24×48                                        │
│  │ (konten bisa scroll) │                                         ┌──┐         │
│  │                      │                                         │⊙ │         │
│  │                      │                                         │+ │         │
│  │──────────────────────│                                         │− │         │
│  │ Data: NASA FIRMS ... │  [82 Skor risiko … | ◯ Ukuran halo …]   └──┘         │
│  └──────────────────────┘                         Diperbarui 09 Okt, 14:05 WIB │
│  ← panel 400 px →                                                            16│
└───────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Posisi elemen

| Elemen | Posisi | Ukuran |
| --- | --- | --- |
| Peta | `inset: 0` (layar penuh) | — |
| Panel | `left 16, top 16, bottom 16` | lebar 400, radius 16, bayangan `md` |
| Tab buka/tutup panel | `left 416`, tengah vertikal | 24 × 48, sudut kanan 8 |
| Baris chip (dropdown + kategori) | `left 432, top 16, right 16`, boleh turun baris | tinggi 36, gap 8 |
| Menu dropdown provinsi | 44 px di bawah chip | lebar 240 |
| Dialog izin lokasi | `left 432, top 68` | lebar 360, radius 16, bayangan `lg` |
| Keterangan peta | `left 432, bottom 16` | tinggi 36 |
| Kontrol peta (lokasi, zoom) | `right 16, bottom 48` | tombol 40 × 40, gap 8 |
| Waktu pembaruan | `right 16, bottom 16` | tinggi 24 |

Saat panel **ditutup**: panel bergeser `translateX(-432px)` dan memudar, tab pindah ke `left 0`, chip dan keterangan peta pindah ke `left 16`, dan area peta melebar penuh. Semua bergerak bersamaan 300 ms.

### 6.3 Isi panel

```
Panel (flex kolom, overflow hidden)
├─ Area search      padding 16 16 0        (tetap, tidak ikut scroll)
├─ Area konten      padding 20 16 16       (scroll, class soft-scroll + soft-fade)
│   └─ tumpukan bagian, jarak antar-bagian 24
└─ Footer atribusi  padding 12 16, garis atas `border`   (tetap)
```

**Tampilan Ringkasan** (urutan dari atas):
1. Judul `title-lg` ("Indonesia hari ini" / "<Provinsi> hari ini") + subjudul `small` + badge Beta di kanan.
2. Kartu lokasi: *Risiko di sekitar kamu* (kartu aksi + tombol Gunakan lokasi), atau *Di sekitar kamu* (kartu info: label, nama wilayah + badge, 2 tile; tanpa tombol — lokasi tetap aktif selama sesi; detail lewat pin; crosshair peta memusatkan ulang), atau pesan izin ditolak (kartu info).
3. Kartu info *Titik panas 24 jam*: angka `number-lg` + perubahan harian di kiri, sparkline 128×40 + "7 hari terakhir" di kanan.
4. Bagian *Wilayah risiko tertinggi* (5 teratas) atau *Hasil pencarian*: daftar baris wilayah.

**Tampilan Detail wilayah** (urutan dari atas):
1. Kepala: nama `title-lg`, lalu baris ikon pin + provinsi · koordinat (Mono 12). Jarak ke kartu risiko 16.
2. Kartu risiko.
3. *Ringkasan* (paragraf).
4. *Yang bisa kamu lakukan* (kartu info berisi daftar centang).
5. *Kondisi saat ini* (grid 2 kolom, 6 tile, gap 8).
6. *Tren titik panas 7 hari* (judul + "8 → 23 titik" di kanan, grafik tinggi 64, label tanggal awal–akhir).
7. *Info teknis satelit* (tombol lipat 36 px; isi: Waktu, Satelit, Tingkat keyakinan, Intensitas api (FRP) dengan garis pemisah).

### 6.4 Lapisan (z-index)

| Lapisan | z-index |
| --- | --- |
| Peta, halo | 0 |
| Pin | 10 (aktif/hover 20) |
| Cluster | 12 |
| Titik lokasi pengguna | 15 |
| Overlay peta (chip, keterangan, kontrol, waktu) | 30 |
| Panel | 40 |
| Tab panel | 41 |
| Dialog izin lokasi | 50 |
| Lapisan klik-luar dropdown | 59 |
| Tombol & menu dropdown | 60 |

## 7. Perilaku & motion

- Klik pin/kartu → panel berganti detail + peta `flyTo` ke wilayah (600 ms).
- Zoom jauh → cluster (MapLibre `cluster: true`); scroll/pinch zoom, drag geser, double-click zoom in; batasi ke Indonesia dengan `maxBounds`.
- Hover 150 ms ease · panel geser 300 ms `cubic-bezier(.2,.7,.2,1)` · ganti tampilan panel fade + naik 4 px, 220 ms.
- Scroll panel: scrollbar tipis, transparan dan baru tampak saat hover (`#D3DBD6`), fade 12/24 px atas/bawah, `overscroll-behavior: contain`.
- Hormati `prefers-reduced-motion` (matikan pulse dan transisi).
- Lokasi: kartu pra-izin (Lanjutkan / Nanti saja) dulu, baru prompt browser. Ditolak → "Akses lokasi ditolak. Cari kabupaten/kota lewat kolom pencarian, atau aktifkan lokasi di pengaturan browser."

## 8. Copywriting

- Sapaan **"kamu"**; huruf besar hanya di awal kalimat; **tidak ada teks kapital semua**.
- Istilah: **titik panas** (bukan hotspot), **tingkat keyakinan** Rendah/Sedang/Tinggi (bukan confidence), **intensitas api (FRP)**. Nama satelit dan PM2.5 tetap.
- Angka desimal pakai koma (9,2 km), kecuali koordinat. Tanggal: "09 Okt 2026, 14:05 WIB".
- Waktu deteksi memakai zona wilayahnya (WIB/WITA/WIT); waktu "Diperbarui" tetap WIB.
- Detail wilayah wajib punya "Yang bisa kamu lakukan" (saran per kategori + kualitas udara; Sangat tinggi menyebut Damkar 113 / darurat 112).
- Penjelasan "titik panas belum tentu kebakaran" dan arti skor ada di ikon ⓘ.
- Badge "Beta" selama uji coba MVP, hapus setelah stabil. Semua angka di mockup adalah data contoh.
