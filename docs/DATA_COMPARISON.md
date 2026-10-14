# Perbandingan sumber aktual — 12 Oktober 2026

Kode Python dan React diperiksa pada commits upstream066560425055f844998d7b3bcc9b8567cf39f103 dandd00a89e2ee8e2ed38243594b4199d9866a330ac. Kode sumber bukan bukti isi DB live.

API Python yang tercantum pada env production FE lama adalah api-forever-young.onrender.com. Empat endpoint /v1/regions, /hotspots, /region-catalog dan /meta timeout pada pemeriksaan ini. Tidak ada kredensial DB Python yang digunakan. Karena itu **kelengkapan isi data Python vs Go belum dapat ditentukan**.

Go dev benar-benar diambil melalui login dan Bearer: katalog38provinsi/514wilayah dengan kode resmi BIG;262wilayah aktif, seluruhnya memiliki nilai cuaca dan PM2.5;14.997featureGeoJSON24jam (termasuk confidence rendah),0unmapped;13.047canonical24jam sedang+tinggi;7hari tren. DB mempertahankan15.483observasi mentah. Nilai ini berbeda karena dedup/confidence/window, bukan harus dibuat sama. Semua source status saat cek API adalah terlambat dan indikator stale: scheduler dev belum aktif, jangan mengklaim real-time atau skor fresh.

| Logic                          | Python code                               | Go/FE branch                                                                      |
| ------------------------------ | ----------------------------------------- | --------------------------------------------------------------------------------- |
| NASA sources                   | SNPP,NOAA20,NOAA21,MODIS                  | Keempatnya; parser/dedup/upsert/RLS existing, NOAA21 ditambahkan dari audit       |
| Katalog                        | GADM codes, polygon/bbox/center           | Kode resmi BIG; fullcatalog RLS, bbox/center/timezone                             |
| Risk                           | Count-only1/10 thresholds                 | CompositeScore requirement awal; FE memakai kategori server + pendingvalidation   |
| Cuaca/air hilang               | Fallback0/baik/aman                       | Nullable/missing/stale, tidak ada FWI rekaan                                      |
| Dataset retention              | DELETEhotspots setiaprun                  | Raw/historyupsert dipertahankan                                                   |
| Refresh meteo-only             | Ada                                       | WORKER_MODE=meteo dipindahkan ke Go                                               |
| Area mask                      | Indonesia bbox                            | MaskPostGIS perclient + sourceSHA/provenance + migration/seed                     |
| Additional natural-hazard data | Tidak ada adapter di router Python        | BMKGgempa/desa + OpenMeteo/GloFAS on-demand; FE sekarang punya interface          |
| History/meta                   | UTCcalendar shortcuts and shortdatawindow | Rolling24h,7hari wilayah timezone,per-sourcefreshness; FE menampilkan             |
| Access/client management       | Tidak ada                                 | GoRBAC +fixedclientroles/FORCERLS; FElogin/cookies/session switch/cache isolation |

Tidak menyalin data live Python ke Go tanpa akses/provenance/crosswalk karena kode GADM dan BIG berbeda. Tidak mengambil shortcut FWI/ISPU/border-nearest/timezone Python sebagai standar resmi. Dataset yang lebih baru/lengkap di DB Python dapat ditinjau kemudian bila API kembali tersedia; hasil audit ini tidak mengarang counts Python.
