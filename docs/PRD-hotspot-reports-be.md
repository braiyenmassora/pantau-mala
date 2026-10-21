# PRD — Laporan warga (hotspot reports) · Backend

**Status:** BE tersedia di `api-pantau-mala@main` · FE terintegrasi (React Query + gateway)  
**Tujuan:** Persistensi + API laporan warga per titik panas satelit, mengganti store `localStorage` di FE.

## Masalah

Deteksi satelit tidak selalu punya konteks lapangan. Warga perlu kirim laporan (foto, apa yang dilihat, deskripsi) di koordinat titik panas. Data harus publik dibaca, diawasi write, dan digabung per titik (~1 m).

## Di luar scope (v1)

- Moderasi AI / verifikasi resmi
- Auth wajib untuk baca
- Notifikasi push / email
- Edit/hapus oleh pelapor (kecuali admin internal nanti)

## Pengguna & alur

| Aktor | Kebutuhan |
|-------|-----------|
| Publik (FE) | List laporan per wilayah / per titik; detail; kirim laporan + foto |
| Ops / admin | Rate limit, audit, hapus konten bermasalah (fase belakangan OK) |

Alur FE saat ini: panel wilayah → list → detail → tulis laporan di titik → (setelah BE) sync API.

## Konsep data

**Kunci titik:** `point_lat` / `point_lon` = lat/lon dibulatkan **5 desimal** (~1 m). Semua laporan di kunci yang sama digabung di UI.

| Field | Tipe | Catatan |
|-------|------|---------|
| `id` | UUID | PK |
| `lat`, `lon` | float | Koordinat mentah submit |
| `point_lat`, `point_lon` | float | Hasil rounding server |
| `region_code` | string? | Kode kab/kota FE |
| `hotspot_time` | timestamptz? | Waktu deteksi satelit terkait (opsional) |
| `sighting` | enum | `asap` \| `api_terlihat` \| `tidak_yakin` \| `sudah_padam` |
| `author_name` | string(1–80) | Nama tampilan |
| `description` | string(≤500)? | Teks bebas |
| `photo_url` | string | URL objek storage (bukan data-URL) |
| `created_at` | timestamptz | Server |

**Foto:** upload terpisah (presigned URL atau `multipart`) → simpan URL publik/signed di row. Jangan terima base64 besar di JSON body.

## API (usulan)

Prefix sama stack existing: `/api/v1`. Gateway FE: izinkan GET/POST (Bearer server seperti telemetry bila perlu).

### `GET /api/v1/hotspot-reports`

Query (salah satu wajib):

- `region_code=` — list wilayah (FE panel)
- `point_lat=` + `point_lon=` — list satu titik (rounded server-side sama)

Response: `{ data: HotspotReport[] }` urut `created_at` desc. Pagination sederhana (`limit` default 50, max 100) OK.

### `GET /api/v1/hotspot-reports/{id}`

Detail satu laporan. 404 jika tidak ada.

### `GET /api/v1/hotspot-reports/counts`

Query: `points=` JSON array `[{lat,lon},…]` atau batch singkat.  
Response: `{ data: [{ point_lat, point_lon, count }] }` untuk badge marker.

### `POST /api/v1/hotspot-reports`

Body JSON (setelah foto sudah di-upload):

```json
{
  "lat": -2.1,
  "lon": 113.5,
  "region_code": "IDN.1.1_1",
  "hotspot_time": "2026-10-18T12:00:00Z",
  "sighting": "asap",
  "author_name": "Sari W.",
  "description": "Asap ke utara…",
  "photo_url": "https://…"
}
```

Validasi: `sighting` enum; `author_name` wajib; `photo_url` wajib v1; `description` opsional ≤500. Server hitung `point_*` + `id` + `created_at`.

Response: `201` + objek laporan.

### Upload foto (pilih satu)

- **A (disarankan):** `POST /api/v1/hotspot-reports/photo` → `{ upload_url, public_url }` lalu client PUT file; atau  
- **B:** `multipart` langsung di POST laporan.

Batas: jenis image, ukuran ~1–2 MB, virus scan opsional nanti.

## Non-fungsional

- **Rate limit** POST per IP (dan per `Origin`): ketat (mis. 5/jam), GET longgar.
- **Origin / CORS** selaras gateway FE.
- **Abuse:** jangan trust geo dari body untuk otorisasi; simpan IP hash opsional untuk audit.
- **Disclaimer produk:** laporan warga ≠ verifikasi resmi (sudah di copy FE).
- **OpenAPI** + migration SQL wajib sebelum merge.

## Migrasi FE (selesai)

1. ✅ `src/data/hotspot-reports.ts` store lokal → fetch/mutation React Query.
2. ✅ Hapus seed demo + `localStorage` key `pantau-mala:hotspot-reports-demo-v2`.
3. ✅ Gateway worker: allowlist path GET/POST hotspot-reports (+ upload).

## Acceptance (BE v1)

- [ ] Insert + list by `region_code` dan by point key konsisten dengan rounding 5 desimal  
- [ ] Counts cocok dengan jumlah list per titik  
- [ ] Foto tersimpan di object storage; URL valid di GET  
- [ ] Rate limit menolak flood POST  
- [ ] OpenAPI + migration ada di repo BE  
- [ ] FE demo bisa diganti tanpa ubah shape field di atas  

## Referensi FE

- Model & rounding: `src/data/hotspot-reports.ts`  
- UI: panel list / detail / compose di `src/components/panel/citizen-report-*.tsx`
