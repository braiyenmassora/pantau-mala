# Handoff FE ↔ Go

Kontrak Go/OpenAPI adalah acuan branch ini. Kontrak Python v2 tetap sebagai referensi historis; perbedaan utama ada pada envelope `data`, nama field Indonesia, nullable serta autentikasi/client isolation.

| Konsumsi              | Endpoint Go                                                     | Interface                                                                                |
| --------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Login/pulihkan/logout | POST/auth/login, POST/DELETE/auth/browser-session               | AccessGate /login, cookie + memory bearer                                                |
| Client                | GET/auth/clients, POST/auth/client-session body `{client:slug}` | Selector workspace dari response server, tanpa selector role                             |
| Wilayah               | GET/api/v1/regions?limit=1000&offset=N                          | Decoder Go→view model; paginasi, kategori server dan state tidak_tersedia                |
| Katalog lengkap       | GET/api/v1/region-catalog                                       | Envelope data; English catalog fields, official BIG codes, bbox/center/timezone          |
| Hotspot               | GET/api/v1/hotspots.geojson                                     | properties waktu/satelit/keyakinan/kode_wilayah→typed GeoJSON; geolokasi lokal           |
| Status                | GET/api/v1/data-status                                          | Badge ringkas + daftar seluruh sensor dengan timestamp/status                            |
| Ringkasan             | GET/api/v1/summary                                              | Seluruh client aktif (bukan hanya filter peta), tren, count, perubahan nullable          |
| Riwayat               | GET/api/v1/regions/:code/history                                | Tabel tanggal/count/skor, nullable; tanggal mengikuti server                             |
| Gempa                 | GET/api/v1/earthquakes?kind=latest/felt/m5                      | Daftar kejadian, waktu, magnitudo/depth/koordinat/potensi/dirasakan, link shakemap resmi |
| Prakiraan             | GET/api/v1/weather/bmkg?adm4=NN.NN.NN.NNNN                      | Kode desa resmi dimasukkan pengguna; bukan menebak dari kode kabupaten                   |
| Debit                 | GET/api/v1/regions/:code/river-discharge                        | Tanggal UTC dan nilai nullable; grid model, bukan warning banjir                         |

`src/data/go-contract.ts` memvalidasi wire dan memetakan ke types untuk peta. `extended-contract.ts` memvalidasi sumber tambahan. Tidak mengubah FWI null menjadi nol atau kategori nullable menjadi rendah. `tidak_tersedia` adalah state tampilan FE; tidak dikirim sebagai kategori bisnis ke backend. Skor masih proposal PENDING_VALIDATION; nilai/kelas dan waktu perhitungan memakai backend.

Authorization wajib Bearer pada REST. Browser restore bukan cara mengakses data memakai cookie langsung; cookie hanya ditukar lewat route auth yang sempit. FE dan auth/data routes harus satu origin. Vite proxy dev memakai changeOrigin=false. Produksi wajib menyediakan route reverse proxy/BFF yang sesuai; HTTPS, Host/Origin dan cookie semantics dipertahankan. Tanpa ini FE statis lama belum kompatibel hanya dengan mengganti VITE_DATA_URL.

Timeout restore15detik dan data20detik; tidak infinite loading. Request dibatalkan saat query dibuang/switch. Response401 dari request client lama tidak boleh mengakhiri sesi client baru. Cache key meliputi client_id+generation+path; logout/switch membersihkan query cache, pencarian/selection dan koordinat. API server tetap menentukan RBAC; dropdown workspace bukan authorization.

Feed tambahan tidak dimuat sebelum dibuka/diminta. BMKG weather/GloFAS adalah adapter on-demand, bukan histori yang telah diingest worker. Source diambil dan keterangan respons diperlihatkan. Management user/API key, aktivitas dan operational job console tetap pada backend CMS; bukan fitur publik peta FE.

## Validasi manual owner

1. Buka127.0.0.1:5173/login, masuk dengan akun consoleGo, reload: sesi tetap tersedia selama belumexpired.
2. Pada320/360/390/1366px, buka/tutup panel dan uji Tab/Shift+Tab/Escape, input password/eye, overflow dan reduced motion.
3. Cari wilayah tanpa deteksi lewat katalog; bedakan sumber belum siap dari zero detections valid.
4. Buka detail: skor/stale/missing, last detection, cuaca/AQ, riwayat, lalu tombol debit. FWI tidak diisi rekaan.
5. Buka sumber tambahan, coba feed gempa dan adm4 resmi yang tersedia. Periksa loading/error/empty dan retry.
6. Jika ada dua client yang diizinkan, switch; data/filter/selection/cache client sebelumnya harus hilang. Logout harus kembali/login dan token lama ditolak.

UI final panel tambahan belum ditest browser otomatis setelah owner meminta berhenti. Build/lint/unit/live-API-contract tetap dilakukan. Script browser fixture hanyalah alat optional untuk permintaan eksplisit berikutnya; tidak ada browser job otomatis pada CI branch ini.

## Override: mode client server dari env

Mode default contoh env sekarang client. GET `/frontend/session` mengembalikan modeclient+principalreader tanpa token; REST melewati gateway dan server menyisipkan API key scope data:read. Login/switch/logout dan management tidak tersedia pada peta modeclient; gunakan CMS Go8080. Semua pengunjung berbagi client tetap dan kuota server; isolasi antar integrasi menggunakan key/client berbeda. Bun `start` menjalankan gateway produksi dengan staticdist. Checklist login di atas berlaku hanya modeaccount; untuk modeclient uji langsung peta, error expired/revoked, dan tidak ada Authorization/API key di browser.
