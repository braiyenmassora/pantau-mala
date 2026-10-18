# Pengukuran kunjungan gateway

## Sumber pengukuran

Worker pribadi mencatat GET dokumen HTML berhasil sebelum React/session restoration.
Tidak ada cookie, fingerprint, atau sesi buatan pada event server. Asumsi produk:
ini hitungan dokumen yang dilayani, bukan orang unik atau jaminan semua request manusia.
HEAD, aset, prefetch/prerender, dan bot yang teridentifikasi dari UA diabaikan.
Navigasi offline yang hanya membaca cache tidak menjadi kunjungan server.

`run_worker_first: true` diperlukan agar dokumen/aset statis tidak melewati Worker.
Aset non-HTML langsung dilayani tanpa request tambahan ke BE. Dokumen dengan ID
event dinamis memakai `Cache-Control: no-store`; SW menghapus meta ID sebelum
menyimpan shell offline agar kunjungan berikutnya tidak memakai ID lama.

Fallback browser menggunakan meta `pantau-page-view` untuk event ID yang sama.
BE melakukan deduplikasi dan melengkapi sesi browser jika tersedia, tanpa
menambah page view baru. DNT/GPC mengaktifkan mode browser anonim: tidak ada
sessionStorage, session ID, atau referrer yang dikirim, tetapi sinyal kesehatan
tetap dapat diterima secara agregat agar browser privasi tidak kehilangan akses
observabilitas. Untuk DNT/GPC, lokasi yang diteruskan hanya negara jaringan, bukan
region/kota. Geo bukan GPS; browser hanya dilabel sesuai UA/Client Hints yang
benar-benar dikirim. Brave yang menyamar sebagai Chrome tetap bisa tampil sebagai
Chrome: jangan menebak atau menggunakan fingerprint.

## Kegagalan dan batasan

Worker memakai `waitUntil` dan maksimal tiga percobaan dengan ID tetap. BE memakai
Redis Streams existing bila Redis aktif. Ini bukan outbox durable di Cloudflare:
outage yang melewati budget edge dan kegagalan fallback browser masih dapat
menghilangkan event. Kegagalan penerimaan dicatat di log Worker, bukan diubah
menjadi page view palsu. Rate limit/batas antrean tetap berlaku.

Pengukuran tidak boleh menghalangi peta: konfigurasi collector bermasalah tetap
melayani dokumen. Tidak ada token, query/fragmen URL, pesan error mentah, atau IP
pada payload frontend analytics. API key tetap server-only. Metadata IP yang
diteruskan gateway hanya untuk perlindungan/rate limit dan audit request existing.

## Rollout

1. Deploy BE dengan migrasi `0009_frontend_measurement` melalui pipeline existing,
   sebelum Worker. Migrasi menambah source dan mengizinkan sesi kosong tanpa
   menghapus riwayat.
2. Deploy Worker dari `lutuk/personal` setelah disetujui owner. Secret dan
   `FE_ACCESS_MODE=client` tetap sama.
3. Buka FE dari desktop/HP lalu periksa `/traffic?tab=frontend` di CMS. Bedakan
   `server_page_views`, `browser_page_views`, dan sesi browser terukur; jangan
   menjumlahkan kedua source lagi ke total `page_views`.
4. Notifikasi integrasi berada di `/notifications`, hanya badge kecil di header.

Pengujian unit/build tidak membuktikan delivery produksi atau browser fisik.
Migrasi VPS, dry-run Worker, dan deployment harus dilaporkan terpisah.
