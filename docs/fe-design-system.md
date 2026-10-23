# pantau-mala — design system FE

|                   |                                                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Sumber desain** | CMS BE: `api/cms/assets/design-tokens.css`, `api/cms/assets/cms.css`, dan `docs/DESIGN_SYSTEM.md` pada repository `pantau-mala` |
| **Token kode**    | `src/styles/tokens.css`, font lokal di `src/styles/fonts.css`, dan chrome GIS di `src/lib/layout.ts`                            |
| **Copy / ikon**   | [`fe-ui-copy.md`](fe-ui-copy.md)                                                                                                |
| **Kontrak data**  | [`prd-fe.md`](prd-fe.md) — jangan bentrok                                                                                       |

CMS BE adalah **sumber kebenaran visual**, sesuai arahan owner pada 15 Oktober 2026. Font, warna, radius, shadow, dan density kontrol FE mengikuti CMS tanpa menyalin layout dashboard atau mengubah fitur peta. PDF handoff lama tetap menjadi referensi layout GIS dan perilaku, bukan alasan mengembalikan style lama. Jangan menambah palet di luar token.

---

## 1. Prinsip

1. Peta = hero; panel = informasi. Satu pekerjaan per section.
2. Warna risiko hanya untuk poligon / chip / legend status, bukan dekorasi. Titik deteksi satelit memakai ember; angka agregat wilayah memakai badge netral. Status non-risiko (gempa, stale, suhu, error) pakai ink / brand / ink-3.
3. Titik panas ≠ kebakaran (lihat fe-ui-copy).
4. Logo **pantaumala** memakai simbol dan lettering SVG asli CMS backend: `pantau` hijau `#14634C`, `mala` orange `#C2410C`. Jangan mengganti lettering dengan font UI. Aksen UI/lokasi/tombol mengikuti token CMS BE: forest `#14634C`, ember `#C2410C`, slate `#0F172A`. Copy berfokus pada **potensi bencana** (kemungkinan terjadinya bencana), bukan menyatakan bencana alam definitif. **Tidak ada biru dekoratif.**
5. Light mode saja. Grid **4 px**.

### Pola layout (PDF §5 — Maps-like)

| Zona             | Spek PDF                                                              |
| ---------------- | --------------------------------------------------------------------- |
| Map              | Layar penuh                                                           |
| Panel kiri       | Mengambang **400 px**, jarak **16** dari tepi; tab sembunyi **24×48** |
| Chip filter      | Di atas peta; sekaligus legend warna kategori                         |
| Kontrol peta     | Kanan bawah: lokasi, zoom +/− — tiap **40×40**, gap **8**             |
| Legend warna pin | Kiri bawah; inset `--map-overlay-inset` / clearance kanan             |
| Updated-at       | Kanan bawah                                                           |

Token chrome: `--floating-control-offset`, `--map-panel-width`, `--map-panel-edge`, `--map-overlay-inset`, `--map-controls-clearance` (nilai di `LAYOUT`).

---

## 2. Warna (CMS BE → `tokens.css`)

| Token                   | Hex                      | Peran             |
| ----------------------- | ------------------------ | ----------------- |
| `--color-ink`           | `#0F172A`                | text-primary      |
| `--color-ink-2`         | `#475569`                | text-secondary    |
| `--color-ink-3`         | `#64748B`                | metadata terbaca  |
| `--color-line`          | `#E2E8F0`                | border            |
| `--color-surface-muted` | `#F8FAFC`                | kartu info        |
| `--color-map-bg`        | `#F1F5F9`                | fallback peta     |
| `--color-brand` / soft  | `#14634C` / `#EAF3EE`    | aksen UI + lokasi |
| risk high / mid / low   | lihat `risk-category.ts` | dot · tint · text |

Focus ring = brand. Hex MapLibre wajib mirror token.

---

## 3. Spasi, radius, bayangan

Spasi: **4, 8, 12, 16, 20, 24**.

| Ritme                          | Nilai                                                    |
| ------------------------------ | -------------------------------------------------------- |
| Padding panel / tepi layar     | 16                                                       |
| Antar-section                  | 16                                                       |
| Judul bagian → isi / ikon–teks | 8                                                        |
| Dalam section                  | 8–12                                                     |
| Kartu info                     | padding 12; tanpa border bersarang                       |
| Daftar provinsi / kabupaten    | satu container, divider 1px, baris 40 desktop / 44 phone |

| Radius                | px      | Pakai                                  |
| --------------------- | ------- | -------------------------------------- |
| `--radius-ctl`        | **6**   | search, menu item, tombol, chip, badge |
| `--radius-card`       | **8**   | kartu, dropdown                        |
| `--radius-panel`      | **12**  | panel, dialog                          |
| pill (`rounded-full`) | **999** | titik peta, simbol bulat, progress     |

Bayangan: `shadow-sm` untuk kontrol, `shadow-md` untuk dropdown, `shadow-map` untuk panel mengambang. Kartu dan baris daftar tidak memakai bayangan bertumpuk.

Kontrol: tombol kecil **32** desktop / **36** phone; tombol utama **36**; search **36**; chip **32**; badge **24**; kontrol peta **40**; rail **24×48**.

---

## 4. Tipografi

DM Sans (UI) · Plus Jakarta Sans (heading) · system mono (skor, jumlah, koordinat, FRP).

Hanya ukuran **11, 13, 15, 18, 26**:

| Peran                        | Class             | px / line / bobot |
| ---------------------------- | ----------------- | ----------------- |
| caption / label / badge      | `text-xs`         | 11 / 16           |
| small / chip / section-label | `text-sm`         | 13 / 18           |
| body                         | `text-base`       | 13 / 18           |
| paragraph                    | `text-paragraph`  | 13 / 18           |
| title                        | `text-lg`         | 15 / 22 / 600     |
| title-lg                     | `text-xl`         | 18 / 24 / 600     |
| number-lg                    | `text-3xl` + mono | 26 / 30 / 600     |

Sentence case. Sapaan “kamu”. Desimal koma kecuali koordinat.

---

## 5. Komponen kunci

| Komponen        | Spek                                                                                                                   |
| --------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Search          | tinggi **36**, radius kontrol, border + `shadow-sm`, teks 13                                                           |
| Chip filter     | tinggi **32**, compact radius, gap 8, teks 11/500; terpilih = latar forest-soft, teks forest                           |
| Badge kategori  | tinggi **24**, radius kontrol, tint + text kategori, teks 11/600                                                       |
| Tombol          | radius kontrol; utama **36**; kecil **32** desktop / **36** phone; primary brand / sekunder border / lembut brand-soft |
| Radar provinsi  | satu radar berdenyut per provinsi aktif di overview nasional (merah cepat ~850 ms, oranye sedang ~1800 ms)             |
| Deteksi satelit | titik / heatmap dari koordinat NASA FIRMS asli, menyala saat provinsi/kabupaten dipilih                                |

Ikon Lucide stroke **2**: 14 (ⓘ / rail), 16 inline, 18 aksi, 20 kontrol peta.

### Grafik tren

`TrendChart` (`src/components/common/trend-chart.tsx`) adalah komponen reusable untuk
seri tujuh hari dari `trend_7d`/`tren_7h`. Grafik memakai SVG native agar ringan,
responsif, dan tetap dapat dibaca screen reader. Gunakan hanya untuk insight jumlah
titik panas; jangan mengubahnya menjadi skor risiko atau mengisi data yang tidak ada.
Tampilkan garis, area tipis, label sumbu tanggal, serta statistik **Terbaru**,
**Puncak**, dan **Rata-rata**. State kosong harus menjelaskan bahwa riwayat belum
tersedia, bukan menampilkan nol.

Grafik lengkap tampil langsung di detail wilayah, setelah indikator arah tren,
tanpa tab atau accordion. Sparkline kecil hanya pelengkap, bukan pengganti grafik.
Pengujian detail harus memeriksa keberadaan judul grafik agar integrasinya tidak
hilang ketika layout di-refactor.

Warna netral untuk layer MapLibre memakai `src/lib/map-colors.ts`, yang mirror
token `ink` dan `surface`; komponen layer tidak menyimpan literal warna sendiri.
Audit UI tetap memeriksa kode produksi; fixture `.test`/`.spec` tidak dihitung
sebagai copy atau markup yang tampil kepada pengguna.

---

## 6. Motion (PDF §5)

Overview nasional memakai satu radar peringatan per provinsi aktif (data 24 jam
terakhir): siklus cepat (~850 ms) untuk risiko `sangat_tinggi` dan siklus sedang
(~1800 ms) untuk `sedang`. Titik deteksi satelit dan lapisan heatmap hanya menyala
saat pengguna memilih provinsi atau kabupaten, menjaga tampilan nasional tetap bersih
tanpa penumpukan ribuan titik. Animasi mengikuti `prefers-reduced-motion`, berhenti
saat tab tersembunyi, dan dibersihkan saat unmount.

- Easing panel/view: `--ease-out-soft` = `cubic-bezier(0.2, 0.7, 0.2, 1)`
- Hover 150 ms · panel 300 ms · view-in 220 ms · zoom peta 600 ms
- Halo: `--animate-halo-high` / `--animate-halo-mid`
- `prefers-reduced-motion` dihormati

---

## 7. Checklist layar

- [ ] Token mirror PDF (warna, type, radius, shadow)
- [ ] Spacing skala PDF (termasuk 20)
- [ ] Chip/search/tombol pill; kontrol peta 40×40
- [ ] Warna risiko tidak untuk dekorasi
- [ ] Copy dari fe-ui-copy; summary/actions dari API
- [ ] Mobile: teks terbaca; kontrol mudah di-tap

---

_Sumber: Spesifikasi UI handoff developer PDF · token di `tokens.css`._

## Integrasi Go — catatan branch

Data/API Go tidak mengubah palet PDF. AccessGate mengikuti token brand hijau + touch 40–44. Panel mobile tetap margin 16 / lebar viewport−32. State `tidak_tersedia` netral (`ink-3` / surface-muted). Nilai null = —; FWI absent dijelaskan.

Sesuai arahan owner 15 Oktober 2026, `public/brand-symbol.svg` dan
`public/brand-wordmark.svg` identik dengan `api/cms/assets/` di repo backend.
Komponen `Brand` memakai kedua asset tersebut di semua ukuran; varian `textOnly`
hanya menghilangkan simbol, bukan mengubah lettering. Favicon, ikon Apple, gambar
preview sosial, dan theme color mengikuti identitas logo yang sama. Warna logo
adalah pengecualian khusus brand asset, bukan perubahan palet komponen FE.

## 8. Mobile GIS & Interaktivitas Peta

Pada viewport mobile (<640px):

- Kanvas peta selalu interaktif (`pointer-events` aktif, tidak menggunakan atribut `inert`).
- Gestur sentuh multi-touch diaktifkan: 1-jari drag pan, 2-jari pinch-to-zoom, dan double-tap zoom.
- Navigasi kamera dipagari dalam `INDONESIA_NAVIGATION_BOUNDS` (`[88, -16]` s.d. `[148, 12]`) dengan `minZoom` 3.2, memungkinkan eksplorasi seluruh pulau tanpa tersendat batas viewport sempit.
- Panel bawah mengadopsi format bottom-sheet compact (maksimal 64dvh) dengan handle bar sentuh/tap untuk meminimalkan atau memperluas panel, sehingga area peta tetap dominan dan leluasa.
- Kontrol peta (zoom +/− dan lokasi) tetap dapat diakses di kanan bawah secara adaptif di atas panel.

## 9. Indikator model dan konteks event

`TerrainIndicatorCard` adalah komponen reusable untuk indikator tanah dan elevasi Open-Meteo pada detail wilayah. Nilai selalu diberi label `Modelled`, menampilkan waktu valid dan waktu tarik, serta menjelaskan bahwa kelembapan tersebut bukan pengukuran langsung gambut dan tidak mengubah skor risiko.

Konteks NASA EONET tetap dipisahkan dari titik panas FIRMS. Jika ditampilkan, gunakan label `konteks event eksternal`, bukan jumlah deteksi atau konfirmasi lapangan. Gateway client hanya meneruskan endpoint read-only yang terdaftar di `server/client-gateway.mjs`; setiap parameter query baru harus ditambah ke allowlist dan diuji.

## 10. Form laporan warga

`author_name` ditampilkan sebagai **Nama pelapor**, bukan nama tampilan. Form berada langsung di dalam kartu laporan tanpa border kartu kedua: judul dan tombol tutup diikuti divider, field berjarak 12px, dan unggah foto memakai tinggi minimum 64px. Nama pelapor serta kondisi boleh berdampingan saat lebar konten minimal 520px; di bawahnya keduanya kembali satu kolom. Tombol kirim memenuhi lebar pada ponsel dan menjadi tombol kanan yang ringkas ketika ruang cukup. Bantuan pemilihan titik hanya ditampilkan sekali agar state kosong tidak mengulang instruksi yang sama.
