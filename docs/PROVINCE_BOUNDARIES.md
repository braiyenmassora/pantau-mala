# Batas provinsi pada peta

Geometri choropleth disimpan sebagai snapshot GeoJSON dari relasi batas administrasi
OpenStreetMap (`admin_level=4`), bukan polygon yang dibuat dari titik pusat wilayah.
Snapshot mencakup 38 provinsi, termasuk provinsi hasil pemekaran Papua. ID relasi
dan nama provinsi dicatat per feature; nama dari katalog backend dipadankan melalui
normalisasi tanpa menggabungkan provinsi-provinsi Papua.

## Sumber dan ketelitian

- Endpoint pengambilan: API Nominatim, bukan scraping halaman peta.
- Sumber: OpenStreetMap contributors; lisensi ODbL-1.0.
- Ini batas versi komunitas OSM, **bukan** penetapan batas hukum oleh BIG/Kemendagri.
- Nominatim memakai `polygon_threshold=0.0001` derajat. MapLibre memakai
  `tolerance=0` agar tidak menambah simplifikasi geometri snapshot.
- CARTO dan snapshot tidak dijamin identik pada setiap zoom atau revisi data.
  Garis provinsi basemap dipertahankan, tanpa outline choropleth ganda. Fill
  ditempatkan di bawah garis batas dan lapisan air CARTO sehingga batas maritim
  dalam data OSM tidak mewarnai laut pada basemap normal.
- Saat basemap tidak tersedia, garis fallback memakai snapshot yang sama; bentuk
  batas maritim dapat terlihat karena tidak ada lapisan air untuk menutupinya.
- Atribusi OSM dan CARTO tampil di footer panel yang aktif.

## File dan pemuatan

| File                                               | Fungsi                                             |
| -------------------------------------------------- | -------------------------------------------------- |
| `public/data/indonesia-provinces.geojson`          | Snapshot polygon/multipolygon                      |
| `public/data/indonesia-provinces.meta.json`        | Sumber, waktu pengambilan, relasi, hash dan revisi |
| `scripts/sync-province-boundaries.mjs`             | Pembaruan snapshot manual                          |
| `src/data/province-boundaries.ts`                  | Fetch dan verifikasi SHA-256 sebelum render        |
| `src/lib/province-boundaries.ts`                   | Validasi manifest/geometri dan normalisasi nama    |
| `src/components/map/province-choropleth-layer.tsx` | Fill, hover, seleksi dan outline fallback          |

Browser hanya membaca asset lokal aplikasi; tidak memanggil Nominatim saat pengguna
membuka peta. SHA-256 file, 38 ID/nama unik, jenis geometri, koordinat, dan ring
tertutup diverifikasi sebelum data dipakai. Kegagalan pemuatan menyembunyikan layer
ini melalui error boundary tanpa mematikan layer peta lainnya. Web Crypto memerlukan
HTTPS atau localhost.

## Memperbarui snapshot

```sh
pnpm run data:boundaries
```

Script memakai cache respons lokal dan satu request pada satu waktu dengan jeda
minimal 1.1 detik, timeout, dan User-Agent yang mengidentifikasi aplikasi. `--refresh`
mengabaikan cache (`pnpm run data:boundaries --refresh`). Jangan jalankan di browser,
CI, scheduler, atau setiap build. Untuk ekstraksi berkala/besar, gunakan layanan
ekstraksi OSM, bukan public geocoder. Tinjau ulang kebijakan layanan sebelum refresh:

- <https://operations.osmfoundation.org/policies/nominatim/>
- <https://nominatim.org/release-docs/latest/api/Search/>
- <https://www.openstreetmap.org/copyright>

Jalankan validasi di branch pribadi sesuai `docs/DEVELOPMENT_WORKFLOW.md`. Periksa
perubahan ID/nama dan geometri sebelum commit. Tidak ada perubahan kontrak backend,
credential, atau mode gateway client read-only untuk fitur ini.
