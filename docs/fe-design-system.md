# pantau-mala — design system (FE MVP)

|                  |                                                                      |
| ---------------- | -------------------------------------------------------------------- |
| **Sumber desain** | [`Spesifikasi UI (handoff developer).pdf`](./Spesifikasi%20UI%20(handoff%20developer).pdf) — **09 Okt 2026** |
| **Token kode**   | `src/styles/tokens.css` (harus mirror PDF)                           |
| **Copy / ikon**  | [`fe-ui-copy.md`](fe-ui-copy.md)                                     |
| **Kontrak data** | [`prd-fe.md`](prd-fe.md) — jangan bentrok                            |

PDF handoff adalah **sumber kebenaran visual**. `tokens.css` dan komponen mengikuti PDF; dokumen ini merangkumnya untuk developer. Jangan menambah palet di luar PDF/token.

---

## 1. Prinsip

1. Peta = hero; panel = informasi. Satu pekerjaan per section.
2. Warna risiko hanya untuk pin / chip / legend status — bukan dekorasi.
3. Titik panas ≠ kebakaran (lihat fe-ui-copy).
4. Wordmark **pantaumala** (IBM Plex): `pantau` hijau `#1E6B45`, `mala` orange `#C2410C`. Aksen UI/lokasi/tombol = hijau. **Tidak ada biru.**
5. Light mode saja. Grid **4 px**.

### Pola layout (PDF §5 — Maps-like)

| Zona | Spek PDF |
| ---- | -------- |
| Map | Layar penuh |
| Panel kiri | Mengambang **400 px**, jarak **16** dari tepi; tab sembunyi **24×48** |
| Chip filter | Di atas peta; sekaligus legend warna kategori |
| Kontrol peta | Kanan bawah: lokasi, zoom +/− — tiap **40×40**, gap **8** |
| Legend skor/halo | Kiri bawah (bukan warna kategori) |
| Updated-at | Kanan bawah |

---

## 2. Warna (PDF §1 → `tokens.css`)

| Token | Hex | Peran |
| ----- | --- | ----- |
| `--color-ink` | `#14261B` | text-primary |
| `--color-ink-2` | `#52645A` | text-secondary |
| `--color-ink-3` | `#7A8A80` | text-disabled |
| `--color-line` | `#E3E9E4` | border |
| `--color-surface-muted` | `#F6F8F6` | kartu info |
| `--color-map-bg` | `#DCE7EC` | fallback peta |
| `--color-brand` / soft | `#1E6B45` / `#EDF4EF` | aksen UI + lokasi |
| risk high / mid / low | lihat `risk-category.ts` | dot · tint · text |

Focus ring = brand. Hex MapLibre wajib mirror token.

---

## 3. Spasi, radius, bayangan (PDF §3)

Spasi: **4, 8, 12, 16, 20, 24**.

| Ritme | Nilai |
| ----- | ----- |
| Padding panel / tepi layar | 16 |
| Antar-section | 24 |
| Judul bagian → isi / ikon–teks | 8 |
| Dalam section | 8–12 |
| Kartu info | padding 16; tile kecil 12 |

| Radius | px | Pakai |
| ------ | -- | ----- |
| `--radius-ctl` | **8** | menu item, kontrol kotak |
| `--radius-card` | **12** | kartu, dropdown |
| `--radius-panel` | **16** | panel, dialog |
| pill (`rounded-full`) | **999** | search, chip, tombol |

Bayangan: `shadow-sm` / `md` / `lg` / `shadow-map` (pin) — nilai di token.

Touch: kontrol peta & tombol besar **40**; chip **36**; search **48**; rail **24×48**.

---

## 4. Tipografi (PDF §2)

IBM Plex Sans (UI) · IBM Plex Mono (skor, jumlah, koordinat, FRP).

Hanya ukuran **12, 13, 14, 16, 20, 28**:

| Peran | Class | px / line / bobot |
| ----- | ----- | ----------------- |
| caption / label / badge | `text-xs` | 12 / 16 |
| small / chip / section-label | `text-sm` | 13 / 18 |
| body / button | `text-base` | 14 / 20 |
| paragraph | `text-paragraph` | 14 / 22 |
| title | `text-lg` | 16 / 24 / 600 |
| title-lg | `text-xl` | 20 / 28 / 600 |
| number-lg | `text-3xl` + mono | 28 / 32 / 600 |

Sentence case. Sapaan “kamu”. Desimal koma kecuali koordinat.

---

## 5. Komponen kunci (PDF §4)

| Komponen | Spek |
| -------- | ---- |
| Search | tinggi **48**, pill, border + `shadow-sm`, teks 14 |
| Chip filter | tinggi **36**, pill, gap 8, teks 13/500; terpilih = latar `#14261B`, teks putih |
| Badge kategori | tinggi **24**, tint + text kategori, teks 12/600 |
| Tombol | semua pill; besar **40** (teks 14); kecil **36** (teks 13); primary brand / sekunder border / lembut brand-soft |
| Pin | skor di pin; halo pulse Sangat tinggi **2,6 s** / Sedang **3,4 s** |

Ikon Lucide stroke **2**: 14 (ⓘ / rail), 16 inline, 18 aksi, 20 kontrol peta.

---

## 6. Motion (PDF §5)

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

Data/API Go tidak mengubah palet PDF. AccessGate mengikuti token brand hijau + touch 40–44. Panel mobile tetap margin 16 / lebar viewport−32. State `tidak_tersedia` netral (`ink-3` / surface-muted). Nilai null = —; FWI absent dijelaskan. Brand SVG/favicon harus memakai hex PDF (`ink` + `brand`), bukan palet ember lama.
