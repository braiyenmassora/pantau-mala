# forever-young — PRD + API handoff untuk FE

|                           |                                                                       |
| ------------------------- | --------------------------------------------------------------------- |
| **Versi**                 | 2.3-live — 11 Oktober 2026                                            |
| **Audiens**               | Frontend (Vite · React · TanStack Query · Zod)                        |
| **Sumber kebenaran wire** | Dokumen ini + OpenAPI `{base}/docs` pada BE yang jalan                |
| **Keputusan produk**      | §0 di bawah (binding untuk migrasi v2)                                |
| **Copy / ikon / tooltip** | [`fe-ui-copy.md`](fe-ui-copy.md) — wajib dibaca FE (anti-menyesatkan) |
| **Schema live**           | OpenAPI `{VITE_DATA_URL}/docs`                                        |

Salin file ini **dan** `fe-ui-copy.md` ke chat/repo FE. Jangan pakai dummy v1 key Indonesia (`kode`, `bahaya_cuaca`, …).

---

## 0. Keputusan produk (binding)

| Topik                   | Keputusan                                                                                                                        |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Pin `rendah`            | **Permanen MVP:** `/v1/regions` hanya `sedang` + `sangat_tinggi`. Hijau tidak dikirim.                                           |
| Kode wilayah            | **GADM** (`IDN.*`) sebagai sumber join. Kemendagri = fase berikutnya (belum dijadwal).                                           |
| Nama tampilan           | **BE** menormalisasi sebelum wire (`Jawa Tengah`, `DKI Jakarta`, …). FE tidak perlu regex CamelCase.                             |
| `time_zone`             | **BE** mengisi benar (WIB/WITA/WIT dari provinsi). FE boleh pakai field API.                                                     |
| Cadence ingest          | **Resmi 3 jam** (bukan ≤60 menit). Badge stale ≈ **3.5 jam** setelah `meta.updated_at`.                                          |
| `risk_category`         | **Murni NASA FIRMS** — hanya `hotspots_24h` (conf sedang+tinggi). FWI **tidak** masuk rumus risiko.                              |
| Cuaca / FWI / PM2.5     | Tetap di payload untuk kartu info; **bukan** penentu warna pin.                                                                  |
| Tren 7 hari / sparkline | **Di luar MVP.** Jangan tampilkan panah naik-turun atau sparkline. Field `trend_7d` masih ada di JSON (isi BE); FE abaikan dulu. |

### Implikasi UI FE (wajib)

1. Sembunyikan / nonaktifkan chip filter **Rendah** (jangan biarkan kosong seperti chip lain).
2. Legend peta: hanya flame **merah** + **kuning** — hapus copy titik hijau.
3. Search catalog tanpa match di `/v1/regions` → **“Tidak ada titik panas aktif”**, tanpa badge kategori.
4. Copy badge: **“Diperbarui setiap ~3 jam”** (relatif dari `meta.updated_at`).
5. Tooltip risiko: pendek — “makin banyak titik panas satelit (NASA FIRMS), makin tinggi risikonya”. **Tidak** perlu disclaimer FWI/BMKG di kartu risiko.
6. FWI/PM2.5 bila ditampil di kartu cuaca/udara: label terpisah (bukan skor risiko).
7. **Jangan** pakai `trend_7d` untuk UI MVP (sparkline / % vs kemarin dari tren 7 hari / label naik-turun). Kartu nasional cukup Σ `hotspots_24h`.
8. Copy, ikon, tooltip ⓘ: ikuti [`fe-ui-copy.md`](fe-ui-copy.md) — satu pattern ikon, bahasa manusia, **titik panas ≠ kebakaran**.

---

## 1. Ringkasan produk

- Pantau **titik panas** satelit + risiko kab/kota di Indonesia.
- **Titik panas ≠ kebakaran.** Jangan copy “ada kebakaran” hanya dari hotspot.
- Browser **hanya** baca JSON BE. Tidak panggil FIRMS / Open-Meteo.
- Nearby 25 km = **hitung di FE** dari `/v1/hotspots` + Geolocation. Tidak ada endpoint nearby.

---

## 2. Connect

```bash
# .env FE — tanpa slash di akhir
VITE_DATA_URL=http://127.0.0.1:8000
# prod: VITE_DATA_URL=https://<forever-young-api>.onrender.com
```

| Env    | Perilaku                                         |
| ------ | ------------------------------------------------ |
| kosong | Dummy lokal — **harus bentuk v2** (English keys) |
| set    | `{base}/v1/...`                                  |

| Item       | Kontrak                                                                  |
| ---------- | ------------------------------------------------------------------------ |
| Auth       | Tidak ada                                                                |
| Method     | `GET` saja                                                               |
| CORS       | Origin FE di `CORS_ORIGINS` BE                                           |
| Cache      | Dinamis `max-age=300`; catalog `max-age=86400`                           |
| Error body | FastAPI default `{"detail": ...}` — EmptyState; jangan timpa cache bagus |
| Ingest     | Cron **tiap 3 jam**                                                      |

---

## 3. Endpoint (hanya ini)

| Path                     | Body                        | Dipakai untuk                      |
| ------------------------ | --------------------------- | ---------------------------------- |
| `GET /health`            | `{ "status": "ok" }`        | smoke / deploy                     |
| `GET /v1/regions`        | `Region[]`                  | pin, filter, detail, kartu agregat |
| `GET /v1/hotspots`       | GeoJSON `FeatureCollection` | nearby 25 km, layer titik          |
| `GET /v1/meta`           | `Meta`                      | badge diperbarui + status sumber   |
| `GET /v1/region-catalog` | `RegionCatalog`             | search daftar wilayah              |

Path kanonik: **`/v1/*`** (+ `/health`). Tidak ada `/wilayah.json` / key v1.

---

## 4. Aturan wire (Zod)

1. Keys English **`snake_case`**.
2. Enum values domain (banyak Indonesia): `sangat_tinggi`, `FWI dihitung`, `ok` \| `terlambat` \| `gagal`.
3. Koordinat selalu **`[longitude, latitude]`**.
4. **`exclude_none`:** field opsional yang kosong **dihilangkan** (bukan `null`).  
   Zod: `village` / `district` / `region_code` / `note` → `.optional()` atau `.nullish()`.
5. Angka pakai **`z.number()`** (boleh `1` atau `1.0`).
6. **`code` = GADM** (`IDN.12.3_1`), bukan Kemendagri (`62.11`). Join lewat `code` / `region_code`.
7. Nama sudah dinormalisasi BE — tampilkan apa adanya dari API.
8. `last_detection.time` = ISO dengan offset (biasanya **UTC** `+00:00`) → FE convert pakai `time_zone` wilayah.
9. `trend_7d` = **hari kalender UTC** (bukan zona lokal kab).

---

## 5. `GET /v1/regions` → `Region[]`

### Filter MVP

- Hanya `risk_category` ∈ {`sedang`, `sangat_tinggi`}.
- `rendah` **tidak dikirim**. Enum Zod boleh tetap include `rendah` untuk fase berikutnya.

### Field

| Key                         | Type                                         | Req | Catatan                                                   |
| --------------------------- | -------------------------------------------- | --- | --------------------------------------------------------- |
| `code`                      | string                                       | yes | GADM kab/kota                                             |
| `name`                      | string                                       | yes | sudah dinormalisasi                                       |
| `province`                  | string                                       | yes | sudah dinormalisasi                                       |
| `time_zone`                 | `WIB` \| `WITA` \| `WIT`                     | yes | andalkan API                                              |
| `center`                    | `[lon, lat]`                                 | yes |                                                           |
| `risk_category`             | `sedang` \| `sangat_tinggi`                  | yes | MVP wire                                                  |
| `weather_danger.class`      | `aman` \| `waspada` \| `bahaya` \| `ekstrem` | yes |                                                           |
| `weather_danger.fwi`        | number                                       | yes |                                                           |
| `weather_danger.source`     | `BMKG` \| `FWI dihitung`                     | yes | live: `FWI dihitung`                                      |
| `hotspots_24h`              | number                                       | yes | conf `sedang`+`tinggi` saja                               |
| `trend_7d`                  | number[7]                                    | yes | Masih di wire; **FE abaikan di MVP** (post-MVP sparkline) |
| `weather.temp_c`            | number                                       | yes |                                                           |
| `weather.condition`         | string                                       | yes | teks ID singkat                                           |
| `weather.humidity`          | number                                       | yes | %                                                         |
| `weather.wind_kmh`          | number                                       | yes |                                                           |
| `weather.dry_days`          | number                                       | yes |                                                           |
| `air_quality.pm25`          | number                                       | yes | µg/m³                                                     |
| `air_quality.category`      | `baik` \| `sedang` \| `tidak_sehat`          | yes |                                                           |
| `last_detection.time`       | string ISO                                   | yes |                                                           |
| `last_detection.satellite`  | string                                       | yes |                                                           |
| `last_detection.confidence` | `rendah` \| `sedang` \| `tinggi`             | yes |                                                           |
| `last_detection.frp_mw`     | number                                       | yes |                                                           |
| `last_detection.village`    | string                                       | no  | sering absen                                              |
| `last_detection.district`   | string                                       | no  | sering absen                                              |
| `summary`                   | string                                       | yes | siap tampil                                               |
| `actions`                   | string[]                                     | yes | min 1                                                     |

### Contoh live (setelah normalisasi nama + tz)

```json
{
  "code": "IDN.12.3_1",
  "name": "Kayong Utara",
  "province": "Kalimantan Barat",
  "time_zone": "WITA",
  "center": [109.92467473342022, -1.0924542546749865],
  "risk_category": "sangat_tinggi",
  "weather_danger": {
    "class": "bahaya",
    "fwi": 21.5,
    "source": "FWI dihitung"
  },
  "hotspots_24h": 12,
  "trend_7d": [0, 0, 11, 3, 15, 20, 12],
  "weather": {
    "temp_c": 31.9,
    "condition": "Mendung",
    "humidity": 58.0,
    "wind_kmh": 10.1,
    "dry_days": 0
  },
  "air_quality": { "pm25": 104.8, "category": "tidak_sehat" },
  "last_detection": {
    "time": "2026-10-10T08:22:00+00:00",
    "satellite": "MODIS",
    "confidence": "sedang",
    "frp_mw": 8.82
  },
  "summary": "12 titik panas dalam 24 jam (satelit NASA FIRMS).",
  "actions": [
    "Jangan membakar lahan, sampah, atau membuang puntung rokok sembarangan.",
    "Bila melihat api, segera hubungi Damkar 113 atau layanan darurat 112.",
    "Batasi aktivitas di luar ruangan; kualitas udara kurang baik."
  ]
}
```

Catatan: pin MVP hanya muncul jika `hotspots_24h ≥ 1` (`rendah` = 0, difilter BE). `weather_danger` di contoh hanya info cuaca — pin merah karena count ≥ 10.

### Risk rule — murni FIRMS (BE hitung — FE display)

```
rendah         ⇔  hotspots_24h = 0          (tidak dikirim di /v1/regions MVP)
sedang         ⇔  hotspots_24h 1 … 9
sangat_tinggi  ⇔  hotspots_24h ≥ 10
```

Count = deteksi satelit NASA FIRMS, confidence `sedang`+`tinggi`, jendela ~24 jam (setelah dedup/join wilayah).

Tooltip risiko (contoh): “Risiko dari jumlah titik panas satelit NASA FIRMS (24 jam). 1–9 = sedang, ≥10 = sangat tinggi.”

`weather_danger` / `weather` / `air_quality` tetap ada di JSON untuk panel cuaca — **abaikan untuk warna pin**.

### Hitung di FE saja (MVP)

| UI                                    | Rumus                                                  |
| ------------------------------------- | ------------------------------------------------------ |
| Kartu titik panas 24 jam              | Σ `hotspots_24h` (filter aktif)                        |
| Sort daftar                           | `risk_category` lalu `hotspots_24h` desc               |
| % vs kemarin / sparkline / panah tren | **Skip MVP** (butuh `trend_7d` yang lebih valid nanti) |

---

## 6. `GET /v1/hotspots` → GeoJSON 24 jam

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [140.60002, -8.26879]
      },
      "properties": {
        "time": "2026-10-11T03:32:00+00:00",
        "satellite": "VIIRS S-NPP",
        "confidence": "tinggi",
        "frp_mw": 30.31,
        "region_code": "IDN.23.16_1"
      }
    }
  ]
}
```

| Properti                                    | Wajib                                      |
| ------------------------------------------- | ------------------------------------------ |
| `time`, `satellite`, `confidence`, `frp_mw` | ya                                         |
| `region_code`                               | **opsional** (~2% absen di jendela 24 jam) |

- Boleh `confidence: "rendah"` di layer ini.
- Jangan pakai layer ini untuk kartu nasional — pakai `/v1/regions`.
- Nearby 25 km: jarak dari koordinat mentah (tanpa `region_code` tetap OK).
- `features: []` valid.

---

## 7. `GET /v1/meta`

```json
{
  "updated_at": "2026-10-11T05:57:32.890226+00:00",
  "status": {
    "firms": "ok",
    "weather": "ok",
    "air": "ok"
  }
}
```

| Field                              | Nilai                          |
| ---------------------------------- | ------------------------------ |
| `updated_at`                       | ISO 8601                       |
| `status.firms` / `weather` / `air` | `ok` \| `terlambat` \| `gagal` |

FE: tampilkan relatif waktu; anggap stale bila usia > **~3.5 jam** (cadence 3 jam + buffer).

---

## 8. `GET /v1/region-catalog`

- Katalog **lengkap** (termasuk kab tanpa hotspot di `/v1/regions`).
- Pin peta **bukan** dari sini; join via `code`.
- Nama provinsi/kab sudah dinormalisasi sama seperti regions.

| Key                     | Type                               |
| ----------------------- | ---------------------------------- |
| `note`                  | string, opsional                   |
| `provinces[].code`      | string (GADM L1)                   |
| `provinces[].name`      | string                             |
| `provinces[].bbox`      | `[minLon, minLat, maxLon, maxLat]` |
| `provinces[].center`    | `[lon, lat]`                       |
| `regencies[].code`      | string (GADM L2)                   |
| `regencies[].name`      | string                             |
| `regencies[].province`  | string (nama provinsi)             |
| `regencies[].center`    | `[lon, lat]`                       |
| `regencies[].time_zone` | `WIB` \| `WITA` \| `WIT`           |

Contoh nama: `DKI Jakarta`, `Kalimantan Tengah`, `Kep. Bangka Belitung`, `DI Yogyakarta`.

---

## 9. Matriks tanggung jawab

| Concern                               | BE           | FE                        |
| ------------------------------------- | ------------ | ------------------------- |
| Ingest FIRMS / cuaca / udara          | ✓            | —                         |
| Normalisasi nama + `time_zone`        | ✓            | tampilkan                 |
| `risk_category`, `summary`, `actions` | ✓            | tampilkan                 |
| Filter pin tanpa hijau                | ✓            | hide chip Rendah + legend |
| Ambang risiko (count FIRMS)           | ✓            | tooltip pendek FIRMS      |
| FWI / cuaca / PM2.5                   | ✓ sajikan    | info terpisah, bukan pin  |
| Agregat nasional (Σ `hotspots_24h`)   | —            | ✓                         |
| Sparkline / panah tren 7 hari         | —            | post-MVP                  |
| Nearby 25 km                          | —            | ✓                         |
| Search catalog                        | data         | UI + join + fallback copy |
| Error non-2xx                         | `{"detail"}` | EmptyState, jaga cache    |

---

## 10. Checklist migrasi FE

- [ ] Hapus key v1: `kode`, `titik_panas_24j`, `bahaya_cuaca`, `tren_7h`, `deteksi_terakhir`, …
- [ ] Paths → `/v1/regions` · `/v1/hotspots` · `/v1/meta` · `/v1/region-catalog`
- [ ] Zod: `.optional()`/`.nullish()` untuk field hilang; `z.number()` untuk angka
- [ ] Dummy lokal sudah v2 **atau** matikan fallback
- [ ] Chip Rendah disembunyikan; legend tanpa hijau
- [ ] Catalog-only hit → “Tidak ada titik panas aktif”
- [ ] Badge ~3 jam / stale 3.5 jam
- [ ] Tooltip risiko = FIRMS count (1–9 / ≥10); tanpa disclaimer FWI di kartu risiko
- [ ] Join pakai `IDN.*`, bukan `62.11`
- [ ] Pakai `name` / `province` / `time_zone` dari API (sudah normal)
- [ ] Convert `last_detection.time` ke zona wilayah
- [ ] `VITE_DATA_URL` tanpa trailing slash; CORS OK
- [ ] Smoke Zod terhadap BE live / OpenAPI

---

## 11. Di luar lingkup MVP

| Item                          | Status                         |
| ----------------------------- | ------------------------------ |
| Kode Kemendagri               | Belum                          |
| `village` / `district`        | Belum diisi ingest             |
| Auth / POST / WebSocket       | Tidak                          |
| Nearby di server              | Tidak                          |
| Alias path file-style         | Tidak wajib                    |
| `weather_danger.source: BMKG` | Belum; sekarang `FWI dihitung` |
| Update tiap ≤60 menit         | Diganti target **3 jam**       |
| Kirim pin `rendah`            | Post-MVP, belum dijadwal       |

---

## 12. Referensi

| Artifact                 | Path                        |
| ------------------------ | --------------------------- |
| UI copy / ikon / tooltip | `docs/fe-ui-copy.md`        |
| Flag pin                 | `docs/spek-flag-deteksi.md` |
| OpenAPI                  | `{VITE_DATA_URL}/docs`      |
| FE types / Zod / queries | `src/data/*`                |

---

_Handoff FE v2.3: risk murni FIRMS count, tanpa UI tren/sparkline di MVP, cadence 3 jam, nama+tz BE._
