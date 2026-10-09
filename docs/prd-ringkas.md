# PRD Ringkas –  (MVP)

Versi: 9 Oktober 2026

## Ringkasan

aplikasi web (light mode, bahasa Indonesia) yang menampilkan titik panas kebakaran hutan dan lahan di seluruh Indonesia, skor risiko per kabupaten/kota, serta cuaca dan kualitas udara di sekitarnya. Data diperbarui tiap jam oleh worker Go dan dibaca frontend sebagai file statis.

Dokumen ini hanya memuat hal yang wajib selaras dengan [mockup web](https://claude.ai/artifact/Utfs6e6arzmSq2oZ6o9fwM): sumber data, data yang harus disiapkan, kontrak data ke frontend, dan aturan yang memengaruhi tampilan. Detail lengkap ada di [PRD utama](https://claude.ai/code/artifact/fb33b184-05d9-4d53-a561-b5bf976150e6).

## Fitur di web

| Bagian UI | Yang tampil | Data yang dibutuhkan |
| --- | --- | --- |
| Peta | Pin skor berwarna kategori, cluster saat zoom jauh, halo berdenyut untuk Sedang dan Sangat tinggi | Skor, kategori, titik tengah wilayah, jumlah titik panas |
| Chip filter | Dropdown provinsi + chip Sangat tinggi / Sedang / Rendah beserta jumlah wilayah. Awalnya semua tampil; klik chip = tampilkan hanya kategori itu (bisa lebih dari satu) | Provinsi dan kategori tiap wilayah |
| Pencarian | Cari provinsi & kabupaten/kota (termasuk tanpa titik panas) | `daftar-wilayah.json` + `wilayah.json` |
| Panel ringkasan | Titik panas 24 jam, perubahan dibanding kemarin, tren 7 hari, daftar wilayah risiko tertinggi | Total titik panas per hari (7 hari), skor per wilayah |
| Detail wilayah | Kartu risiko (kategori + skor/100 + skala, penjelasan di ⓘ), ringkasan, "Yang bisa kamu lakukan", kondisi saat ini, tren 7 hari, info teknis satelit (terlipat, waktu dalam WIB/WITA/WIT wilayahnya) | Semua isi `wilayah.json` (lihat Kontrak data) |
| Lokasi pengguna | Kartu pra-izin (Lanjutkan / Nanti saja), lalu titik lokasi, radius 25 km, risiko dan titik panas terdekat | `titik-panas-24j.geojson`, dihitung di browser |
| Status data | "Diperbarui 09 Okt 2026, 14:05 WIB" + penanda bila sumber bermasalah | `meta.json` |

Pola tampilan dan teks (warna, tipografi, jarak, sapaan "kamu", tanpa huruf kapital semua) mengikuti artboard Spesifikasi UI di kanvas mockup; developer cukup memakai token di sana.

## Sumber data

Semua data tiap jam diambil oleh worker Go; tidak ada yang diambil langsung oleh browser kecuali basemap dan lokasi pengguna.

| Yang tampil di UI | Sumber | Akses | Catatan |
| --- | --- | --- | --- |
| Titik panas: lokasi, waktu, satelit, tingkat keyakinan, FRP | [NASA FIRMS API](https://firms.modaps.eosdis.nasa.gov/api/) (VIIRS + MODIS) | Gratis, butuh MAP\_KEY; endpoint per negara pakai kode `IDN` | API hanya mengeluarkan CSV ([FAQ FIRMS](https://www.earthdata.nasa.gov/data/tools/firms/faq)) |
| Suhu, kondisi cuaca, kelembapan, angin, hari tanpa hujan | [Open-Meteo Forecast](https://open-meteo.com/en/docs) | Gratis non-komersial, tanpa key | Satu request bisa banyak koordinat (titik tengah kabupaten/kota) |
| Kualitas udara (PM2.5) | [Open-Meteo Air Quality](https://open-meteo.com/en/docs/air-quality-api), variabel `pm2_5` | Gratis, tanpa key | Model CAMS; wajib atribusi Open-Meteo (CC BY 4.0) |
| Cuaca pembanding (opsional) | [BMKG Data Terbuka](https://data.bmkg.go.id) | Gratis | Wajib mencantumkan BMKG sebagai sumber |
| Batas provinsi & kabupaten/kota | BIG (Ina-Geoportal) atau [GADM](https://gadm.org) | Unduh sekali | Disederhanakan agar ringan; simpan di PostGIS |
| Skor, kategori, tren, ringkasan, saran | Dihitung worker | — | Aturan ada di bagian "Aturan logika" |
| Lokasi pengguna | Browser (Geolocation API) | Izin pengguna | Dihitung di perangkat, tidak dikirim ke server |
| Peta dasar | OpenFreeMap / CARTO lewat mapcn | Gratis | Cek lisensi bila dikomersialkan |

Atribusi yang tampil di panel: "Data: NASA FIRMS · BMKG · Open-Meteo".

## Yang perlu kamu siapkan

- [ ] Daftar MAP\_KEY NASA FIRMS (gratis, cukup email) dan simpan sebagai env var `FIRMS_MAP_KEY` di Render.
- [ ] Unduh batas wilayah provinsi dan kabupaten/kota, lengkap dengan kode wilayah resmi Kemendagri agar nama dan kode konsisten.
- [ ] Hitung titik tengah (centroid) tiap kabupaten/kota untuk request cuaca dan posisi pin di peta.
- [ ] Petakan zona waktu tiap provinsi (WIB, WITA, WIT) karena waktu deteksi ditampilkan dalam zona wilayahnya.
- [ ] Buat akun dan resource: bucket Cloudflare R2 (publik hanya-baca), database Neon atau Supabase dengan ekstensi PostGIS, Render Cron Job, Cloudflare Pages.
- [ ] Kumpulkan data karhutla 2019 dan 2023 untuk kalibrasi bobot skor.
- [ ] Cek batas paket gratis dan lisensi: Open-Meteo, basemap, Neon/Supabase, Render, R2.

## Kontrak data ke frontend

Worker menulis file data ke R2. Nama field di bawah adalah kontrak: frontend dan API fase 2 memakai bentuk yang sama. `daftar-wilayah.json` jarang berubah (katalog pencarian); tiga file lain diperbarui tiap jam.

**`wilayah.json`** — satu objek per kabupaten/kota yang punya titik panas dalam 7 hari:

```json
{
  "kode": "62.11",
  "nama": "Kab. Pulang Pisau",
  "provinsi": "Kalimantan Tengah",
  "zona_waktu": "WIB",
  "pusat": [114.25, -2.75],
  "skor": 82,
  "kategori": "sangat_tinggi",
  "titik_panas_24j": 23,
  "tren_7h": [8, 10, 9, 14, 15, 19, 23],
  "cuaca": { "suhu_c": 34, "kondisi": "Cerah", "kelembapan": 48, "angin_kmj": 14, "hari_tanpa_hujan": 9 },
  "udara": { "pm25": 92.4, "kategori": "tidak_sehat" },
  "deteksi_terakhir": { "waktu": "2026-10-09T13:24:00+07:00", "satelit": "VIIRS NOAA-20", "keyakinan": "tinggi", "frp_mw": 18.4 },
  "ringkasan": "Titik panas naik dalam 7 hari, kelembapan 48%, 9 hari tanpa hujan.",
  "saran": ["Jangan membakar lahan, sampah, atau membuang puntung rokok sembarangan."]
}
```

**`titik-panas-24j.geojson`** — FeatureCollection titik (koordinat `[lon, lat]`) yang sudah dideduplikasi, properti: `waktu`, `satelit`, `keyakinan`, `frp_mw`, `kode_wilayah`.

**`meta.json`** — `diperbarui` (waktu ISO, WIB) dan `status` per sumber (`firms`, `cuaca`, `udara`: `ok` / `terlambat` / `gagal`) untuk penanda di pojok peta.

**`daftar-wilayah.json`** — katalog pencarian (statis / jarang berubah; dari BIG oleh worker):

```json
{
  "_catatan": "dummy, ganti dari data BIG oleh worker",
  "provinsi": [
    { "kode": "81", "nama": "Maluku", "bbox": [125.5, -8.5, 135.0, -2.5], "pusat": [128.2, -3.7] }
  ],
  "kabkota": [
    { "kode": "81.71", "nama": "Kota Ambon", "provinsi": "Maluku", "pusat": [128.18, -3.70], "zona_waktu": "WIT" }
  ]
}
```

Pencarian memakai katalog ini lalu digabung dengan `wilayah.json` (skor/titik panas). Pin peta tetap hanya dari `wilayah.json`.

Contoh angka di atas hanya ilustrasi, sama dengan data contoh di mockup.

## Aturan logika

| Aturan | Nilai di MVP | Tampil di UI sebagai |
| --- | --- | --- |
| Skor risiko | 0,5 × titik panas + 0,3 × cuaca + 0,2 × tren (masing-masing 0–100) | Angka "82 /100" di kartu risiko dan pin |
| Kategori | Rendah 0–33 · Sedang 34–66 · Sangat tinggi 67–100 | Warna pin, chip, badge, skala; halo berdenyut untuk Sedang (3,4 dtk) dan Sangat tinggi (2,6 dtk) |
| Titik panas dihitung | Hanya tingkat keyakinan sedang dan tinggi | Angka titik panas & skor; yang rendah tetap tampil di peta |
| Deduplikasi | Deteksi berdekatan dalam jarak dan waktu dari satelit berbeda dianggap satu | Mencegah angka menggelembung |
| Tren 7 hari | Naik bila hari ke-7 > 115% hari ke-1, turun bila < 85%, selain itu stabil | "↑ naik", "↓ turun", "→ stabil" |
| Perubahan harian | (hari ini − kemarin) / kemarin | "▲ 13% dibanding kemarin" |
| Kategori udara | Dari nilai PM2.5 (ambang mengikuti ISPU, perlu dipastikan) | Baik / Sedang / Tidak sehat |
| Saran | Per kategori risiko + tambahan bila udara Sedang/Tidak sehat; menyebut Damkar 113 dan 112 untuk Sangat tinggi | Bagian "Yang bisa kamu lakukan" |
| Ringkasan | Template dari angka, bukan ditulis manual | Bagian "Ringkasan" |
| Radius lokasi | 25 km dari lokasi pengguna | Lingkaran di peta + kartu "Di sekitar kamu" |

## Keputusan terbuka

- [ ] Database: **Neon** (usulan MVP, Postgres + PostGIS murni) atau **Supabase** (bila nanti butuh login dan notifikasi).
- [ ] Batas rentang skor 0–33 / 34–66 / 67–100 dan bobot 0,5 / 0,3 / 0,2: pastikan setelah kalibrasi dengan data 2019 dan 2023.
- [ ] Ambang PM2.5 untuk kategori udara Baik / Sedang / Tidak sehat.
- [ ] Pilihan basemap dan lisensinya bila aplikasi dikomersialkan.

## Sumber

- [NASA FIRMS API](https://firms.modaps.eosdis.nasa.gov/api/)
- [FIRMS FAQ, NASA Earthdata](https://www.earthdata.nasa.gov/data/tools/firms/faq)
- [Open-Meteo Forecast API](https://open-meteo.com/en/docs)
- [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api)
