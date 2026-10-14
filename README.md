# pantau-mala FE — integrasi Go

Frontend React untuk [backend Go](https://github.com/braiyenmassora/api-pantau-mala). Branch FE aktif `main`; backend aktif `develop`. Mode default memakai API key client di server, sehingga pengunjung langsung membuka peta.

## Mulai lokal

1. Jalankan backend dengan konfigurasi privat dan layanan existing sesuai [README BE](https://github.com/braiyenmassora/api-pantau-mala/tree/develop). Default `http://127.0.0.1:8080`; jalankan `make run` di repo BE.
2. Salin `.env.example` ke `.env` hanya jika belum ada. Isi `PANTAU_CLIENT_SLUG` dan `PANTAU_API_KEY` dari CMS Go `/api-keys`, scope `data:read`.
3. Jalankan FE:

```sh
bun install --frozen-lockfile
bun run --bun dev
```

Buka **http://127.0.0.1:5173/**. Port FE tetap 5173; bila terpakai, hentikan proses yang menggunakan port tersebut. `VITE_DATA_URL=/api/v1` tetap relatif; alamat backend diatur lewat `PANTAU_API_ORIGIN`. Gateway server menyisipkan key, browser tidak menerima token. Jangan menyimpan secret dalam `VITE_*`, Git, atau storage browser.

## Cek siap dipakai

```sh
# Backend hidup dan dependensi siap (tanpa bearer)
curl --fail http://127.0.0.1:8080/health/live
curl --fail http://127.0.0.1:8080/health/ready
# FE sudah berjalan: cek identitas client, kontrak, dan kesesuaian hotspot
bun run audit:parity
```

`live` mengembalikan `status: ok`; `ready` mengembalikan `status: ready`. Readiness tidak membuktikan data provider lengkap atau terbaru. Audit keluar nonzero bila request/kontrak gagal atau hitungan berbeda; selisih bisa terjadi karena panel memakai waktu perhitungan worker sedangkan GeoJSON memakai rolling 24 jam saat request. Periksa timestamp/status sumber sebelum menyimpulkan bug. Untuk port backend berbeda, ubah URL health sesuai `PANTAU_API_ORIGIN`.

Jika gateway gagal, cek backend, scope `data:read`, kecocokan slug, masa berlaku/revocation key, dan status client di CMS. Mode akun opsional dijelaskan di [handoff](docs/GO_API_HANDOFF.md). Kontrak aktif: [Go handoff](docs/GO_API_HANDOFF.md) dan OpenAPI BE; dokumen Python lama hanya arsip.

Data yang tersedia:

- Peta hotspot GeoJSON, katalog seluruh wilayah, pencarian, filter termasuk indikator yang belum tersedia.
- Detail wilayah: skor backend dengan status kalibrasi, cuaca/PM2.5 nullable, deteksi/satelit/keyakinan/FRP dan waktu pembaruan.
- Accordion **Riwayat dan debit sungai**: histori tujuh hari dan debit model Open-Meteo/GloFAS.
- Accordion **Sumber dan data tambahan**: ringkasan seluruh client aktif, status per sensor, gempa BMKG dan prakiraan desa BMKG memakai kode adm4 resmi.

Kategori memakai hasil backend; tidak dihitung ulang dengan rule jumlah titik Python. FWI tidak direka: Go belum memiliki FWI terverifikasi. Data kosong/stale tidak ditampilkan sebagai nol/aman. Feed BMKG/debit dimuat sesuai pilihan pengguna, bukan poll semua provider. Koordinat pengguna tetap dihitung lokal di browser.

## Verifikasi

```sh
bun run test
bun run --bun lint
bun run --bun audit:ui
bun run --bun build
# Opt-in memakai file konfigurasi dev privat yang tidak masuk Git:
PANTAU_DEV_TEST_CONFIG=/path/to/private/dev-access.json bun run test -- run src/data/go-live.integration.test.ts
```

113 unit/contract tests dan satu live Go API contract test sudah lulus saat integrasi ini dibuat. Build mencakup TypeScript dan gate ukuran initial JS. Browser validation akhir dilakukan owner secara manual sesuai instruksi; CI tidak meluncurkan browser. Browser emulation yang sempat dijalankan sebelum instruksi tersebut bukan bukti validasi seluruh panel tambahan. Lihat [handoff](docs/GO_API_HANDOFF.md), [design system](docs/fe-design-system.md), [audit data](docs/DATA_COMPARISON.md) dan bukti di docs/evidence.

## Deployment

### Cloudflare Workers

Konfigurasi `wrangler.jsonc` mengirim assets `dist` bersama `worker.ts`. Route `/api`, `/api/*`, `/auth`, `/auth/*`, dan `/frontend/session` dijalankan melalui Worker sebelum fallback SPA. Gateway memakai mode client read-only. Deployment Worker memakai `PANTAU_API_ORIGIN=https://api.pantaumala.live`. Pengembangan lokal tetap memakai `http://127.0.0.1:8080` dari `.env.example`. Untuk deployment lain, atur origin HTTPS backend dan slug client yang sesuai. Worker cloud tidak dapat mengakses backend loopback komputer lokal.

```sh
bun run --bun build
bun x wrangler deploy --dry-run
bun x wrangler deploy
# Provisioning/rotasi key server, isi lewat prompt privat:
bun x wrangler secret put PANTAU_API_KEY
```

Key harus memiliki scope `data:read` dan client slug yang sama dengan `PANTAU_CLIENT_SLUG`. Secret yang sudah terpasang dipertahankan saat deploy; jangan masukkan key ke konfigurasi Wrangler, Git, atau `VITE_*`.

Alamat deployment ditentukan oleh akun dan konfigurasi pengguna. Hasil tes deployment sebelumnya adalah catatan lingkungan pengujian, bukan jaminan readiness instalasi baru; jalankan cek health, gateway, dan data pada lingkungan tujuan.

Produksi membutuhkan **origin yang sama**: host FE melayani assets dan mem-proxy `/api/*` serta `/auth/*` ke Go dengan Host/Origin yang benar. Static Pages tanpa route/proxy tersebut belum bisa memakai pemulihan cookie ini. Tidak menyisipkan key privat ke VITE_* untuk mengakali deployment. Belum deploy ke VPS atau mengganti domain produksi pada perubahan ini.

Bun1.4.3 mengelola dependency, dev dan build (`bun.lock`). Tes memakai Vitest melalui Node karena worker jsdom30 gagal di runtime Bun; jalankan tetap lewat `bun run test`.

## Peta melalui token client server

Mode client tidak meminta username/password pengunjung. Salin `.env.example` ke `.env`, isi `PANTAU_CLIENT_SLUG` dan `PANTAU_API_KEY` hasil CMS Go `/api-keys` dengan scope `data:read`. Client berasal dari token; slug digunakan untuk menolak salah konfigurasi, bukan memilih tenant bebas. Key dev yang dipasang berlaku30hari; buat/rotasi/revoke melalui CMS. Jangan prefix secret dengan `VITE_`. Semua pengunjung memakai data client tersebut dan berbagi kuota client.

`bun run --bun dev` menyediakan gateway dev. Untuk hasil build jalankan `bun run --bun build` lalu `bun run start`; server Bun menyajikan dist dan proxy read-only yang sama. HTTPS dapat diterminasi pada reverse proxy yang sudah ada, tanpa menambahkan provisioning. Static hosting/`vite preview` saja tidak dapat menyimpan secret atau menjalankan gateway. `FE_ACCESS_MODE=account` hanya untuk alur akun sebelumnya pada dev dengan proxy auth.

Gateway mengecek scope/key/client setiap request, menolak mutasi/management, credential pengunjung, query pemilih tenant dan cross-origin. Env kosong/mismatch/revoked menghasilkan error, bukan fallback ke akses tanpa key. `/frontend/session` hanya mengembalikan identitas reader tanpa token. CMS tetap di backend Go. Tidak ada credential FE di Git atau browser.
