# Telemetry frontend pribadi

Tracker ringan berjalan setelah akses `client` terautentikasi. Collector Go
ditambahkan pada repo backend atas permintaan owner; perubahan FE tetap di
`lutuk/personal`, bukan `main`/`develop` milik tim.

- Pengiriman hanya `fetch` async dengan `keepalive`, maksimal 20 event/batch dan
  40 event di RAM; event pertama di-flush setelah 1 detik, lalu batch berikutnya
  setiap 10 detik atau saat halaman disembunyikan/ditutup.
- Endpoint `/api/v1/telemetry` menjadi pengecualian observabilitas yang sempit
  untuk POST. API data bisnis tetap read-only; management tetap di CMS Go.
- Gateway dan Go mewajibkan `Prefer: respond-async` dan
  `X-Pantau-Telemetry-Transport: fetch-keepalive`. Tanpa kontrak: HTTP 400.
  Header bukan bukti flag JavaScript: HTTP tidak bisa membedakan XHR sync yang
  meniru header dari fetch async. SDK ini benar-benar non-blocking; Go selalu
  enqueue ke worker bounded dan mengembalikan 202 tanpa menunggu insert DB.
- Secret API hanya di gateway server. Client ID tidak dikirim browser; tenant
  berasal dari principal bearer yang diverifikasi Go.
- Tidak merekam query, fragment, GPS, raw IP, request body, pesan exception, atau
  stack trace. Referrer hanya origin. Session ID acak per tab sekitar 30 menit;
  ketika DNT/GPC aktif, browser beralih ke mode anonim tanpa session ID,
  sessionStorage, atau referrer. Event tetap first-party dan agregat, bukan
  identitas orang atau fingerprint.
- Negara/region/kota dibaca Worker dari metadata `request.cf`, bukan header geo
  browser. Lokal bisa kosong; lokasi jaringan bersifat perkiraan, bukan GPS.
- Endpoint belum tersedia/menolak 4xx: tracker berhenti, tidak retry berulang.
  Gangguan jaringan, 429, dan 5xx mempertahankan batch di memori dan memberi
  cooldown minimal 30 detik sebelum mencoba kembali dengan UUID deduplikasi yang sama,
  maksimal 3 percobaan per event. Buffer tetap dibatasi 40 event; saat penuh,
  event retry lebih lama diprioritaskan daripada event baru.

Deploy backend beserta migration `0007_frontend_traffic` lebih dahulu, lalu FE.
Data muncul di CMS `/traffic?tab=frontend` (sesi admin); request API tetap di
`/traffic?tab=live`. 202 berarti diterima ke antrean Redis stream ketika Redis
aktif (fallback RAM ketika Redis tidak dikonfigurasi), belum bukti insert DB.
Ringkasan
memisahkan page views, sesi anonim, dan error FE/API yang dilaporkan.

Validasi tanpa browser: `pnpm run lint`, `pnpm test`, `pnpm run build`.
Tidak ada paket tracker tambahan atau service lokal baru. Deployment/push
tetap mengikuti `docs/DEVELOPMENT_WORKFLOW.md` dan instruksi owner.
