# pantau-mala FE — integrasi Go

Frontend React untuk API Go pantau-mala. Repo ini tetap terpisah dari [backend](https://github.com/braiyenmassora/api-forever-young/tree/feat/pantau-mala-go-backend); branch integrasi FE adalah `feat/pantau-mala-go-integration`. Branch `main` mempertahankan implementasi teman sebelum merge.

```sh
bun install --frozen-lockfile
bun run --bun dev
```

Dev: **http://127.0.0.1:5173/**, login **/login**. Jalankan API Go existing pada127.0.0.1:8080. Vite mem-proxy `/api` dan `/auth` dengan Host/Origin frontend dipertahankan. Gunakan akun yang sama dengan console Go; tidak perlu memilih role atau memasukkan slug client untuk login default.

`VITE_DATA_URL=/api/v1` pada `.env.example`/`.env.production`. Tidak ada DSN, password, API key atau token dalam env/bundle FE. Browser memegang bearer di memori; reload memulihkan sesi lewat cookie HttpOnly/SameSiteStrict pada `/auth/browser-session`. Logout merevoke sesi. Workspace hanya berasal dari server; pergantian client merotasi sesi, menghapus cache/filter/lokasi dan mengisolasi query key. Secret tidak dimasukkan ke localStorage/sessionStorage.

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

Produksi membutuhkan **origin yang sama**: host FE melayani assets dan mem-proxy `/api/*` serta `/auth/*` ke Go dengan Host/Origin yang benar. Static Pages tanpa route/proxy tersebut belum bisa memakai pemulihan cookie ini. Tidak menyisipkan key privat ke VITE_* untuk mengakali deployment. Belum deploy ke VPS atau mengganti domain produksi pada perubahan ini.

Bun1.4.3 mengelola dependency, dev dan build (`bun.lock`). Tes memakai Vitest melalui Node karena worker jsdom30 gagal di runtime Bun; jalankan tetap lewat `bun run test`.
