# Migrasi Go Admin FE: HTML → React (langkah demi langkah)

Panduan **portable** untuk repo Go CMS/console (saat ini HTML biasa). Salin file ini + `design-system.md` ke repo Go sebelum mulai.

Tujuan: admin UI React yang **visual selaras** client map pantaumala, tanpa menyalin MapLibre / client-gateway read-only.

---

## Prinsip migrasi (baca dulu)

1. **Strangler, bukan big-bang** — satu route React hidup dulu; HTML lama tetap sampai diganti.
2. **Backend Go tetap sumber auth & API** — React hanya UI; jangan pindahkan business logic ke FE.
3. **Design system dulu, komponen belakangan** — token CSS wajib sebelum “bikin dashboard cantik”.
4. **Jangan campur client map** — tidak perlu `FE_ACCESS_MODE=client`, heatmap, atau panel GIS.
5. **Satu halaman selesai = cutover route itu** — baru lanjut halaman berikutnya.
6. **Agen wajib ikut fase** — tanpa rule, agen akan menambal HTML lama.

---

## Hasil akhir yang diharapkan

```
repo-go/
  cmd/… / internal/…          # API + auth (tetap)
  web/                        # ATAU apps/admin/
    package.json              # React + Vite + Tailwind 4
    src/
      styles/tokens.css       # dari design-system.md §2
      components/ui/          # Button, Card, Badge, Input, …
      pages/                  # Login, Dashboard, …
      auth/                   # session cookie/bearer ke Go
    index.html
  docs/
    design-system.md          # SSOT visual
    go-admin-react-migration.md
  .cursor/rules/
    admin-fe-react.mdc        # rule agen (lihat lampiran)
```

Go tetap serve API; untuk UI ada dua pola (pilih satu di Fase 0):

| Pola | Cara | Cocok jika |
| --- | --- | --- |
| **A. Vite dev + Go API** | FE `:5174`, API `:8080`, proxy `/api` `/auth` | Dev cepat |
| **B. Go embed dist** | `embed` folder `web/dist`, SPA fallback | Produksi sederhana |

Rekomendasi: **A saat migrasi**, **B saat ship**.

---

## Fase 0 — Inventaris & keputusan (½–1 hari)

**Jangan tulis React dulu.**

### Checklist

- [ ] Daftar semua halaman HTML admin sekarang (`/dashboard`, `/login`, clients, keys, users, …).
- [ ] Untuk tiap halaman: URL, role (`admin` / `reader` / `platform_admin`), form POST/GET yang dipakai.
- [ ] Catat endpoint API yang sudah JSON vs yang hanya HTML form.
- [ ] Putuskan pola serve: A (proxy) atau B (embed).
- [ ] Salin ke repo Go:
  - `docs/design-system.md`
  - `docs/go-admin-react-migration.md` (file ini)
- [ ] Pasang rule agen (Lampiran A).

### Urutan cutover halaman (disarankan)

1. Login (atau reuse login HTML dulu — lihat Fase 3)
2. Shell layout (nav + outlet)
3. Dashboard ringkas (read-only stats)
4. Halaman CRUD paling sederhana
5. Halaman rumit (keys, multi-client, …)
6. Hapus template HTML yang sudah diganti

**Exit criteria Fase 0:** daftar halaman + urutan cutover tertulis di issue/README singkat.

---

## Fase 1 — Scaffold React (tanpa fitur bisnis)

### Langkah

1. Di repo Go, buat folder `web/` (atau `apps/admin/`).
2. Scaffold Vite + React + TypeScript.
3. Pasang Tailwind CSS v4 (`@tailwindcss/vite`).
4. Salin blok token dari `design-system.md` §2 → `web/src/styles/tokens.css`.
5. Import di `web/src/index.css`:

   ```css
   @import 'tailwindcss';
   @import './styles/tokens.css';
   ```

6. Pasang font IBM Plex Sans 400/500/600 + Mono 500/600 (`@fontsource/…` atau self-host).
7. Body: `font-sans`, `text-ink`, `bg-map-bg` (atau netral admin yang sama).
8. Dev proxy Vite → `http://127.0.0.1:8080` untuk `/api`, `/auth` (sesuaikan path Go).
9. Halaman placeholder: `/` → “Admin React OK” + tombol primary dari token.

### Jangan di fase ini

- Jangan port semua halaman.
- Jangan tambah MapLibre.
- Jangan ubah kontrak API Go kecuali kurang JSON.

**Exit criteria:** `pnpm dev` tampil, token terpasang, tombol brand hijau terlihat, proxy API tidak CORS-error untuk satu `GET` sederhana (kalau ada).

---

## Fase 2 — Design system components (minimal)

Bangun hanya yang admin butuh. Ikuti resep di `design-system.md` §5.

### Urutan komponen

1. `focusRing` helper  
2. `Button` (primary / secondary / soft / ghost)  
3. `Input` + label + error text (error = ink, bukan risk-high)  
4. `Card` (+ Header / Title / Content)  
5. `Badge` (meta + risk kalau perlu)  
6. `EmptyState`  
7. `PageShell` (sidebar/topnav sederhana — **bukan** panel peta)

### Aturan

- Class pakai token (`bg-brand`, `rounded-card`, `text-ink-2`) — bukan hex di JSX.
- Tinggi kontrol utama 44px.
- Kartu konten: radius 12, border line, **tanpa** shadow; chrome mengambang boleh shadow-chrome.

**Exit criteria:** Story/halaman `/dev/ui` (opsional) atau satu halaman demo yang menampilkan semua komponen di atas.

---

## Fase 3 — Auth bridge (paling kritis)

Admin **bukan** mode client-key. Pakai session/account ke Go.

### Langkah

1. Pastikan Go punya endpoint JSON session, contoh pola (sesuaikan nama aktual di Go):
   - `POST /auth/login`
   - `GET /auth/browser-session` (atau equivalent)
   - `DELETE /auth/browser-session` (logout)
2. Di React: store session tipis (zustand atau context) — token/cookie sesuai yang Go sudah pakai.
3. `AccessGate`: anonymous → Login page; authenticated → app shell.
4. Semua `fetch` ke API: credentials sesuai Go (`same-origin` atau bearer).
5. 401 → clear session → login.
6. Guard role: sembunyikan nav/aksi write jika `reader`.

### Strategi login sementara (lebih aman)

- **Opsi 3a:** Login tetap HTML Go; setelah login, redirect ke React app yang baca cookie session yang sama.  
- **Opsi 3b:** Login React penuh (lebih rapi, lebih banyak kerja).

Mulai dengan **3a** jika cookie session sudah ada — migrasi lebih mulus.

**Exit criteria:** login → masuk shell React → refresh tetap terautentikasi → logout bersih. Tidak ada API key client di browser.

---

## Fase 4 — Shell + Dashboard (cutover pertama)

1. Layout: topbar/sidebar, brand wordmark opsional, nav link, slot `Outlet`.
2. Route `/dashboard` (atau path yang sama dengan HTML lama).
3. Isi dashboard **read-only dulu**: angka/summary dari API yang sudah ada.
4. Di Go: arahkan route dashboard ke SPA (atau reverse proxy path).
5. Biarkan link lain masih ke HTML lama.

**Exit criteria:** user admin membuka `/dashboard` dapat UI React; halaman lain belum rusak.

---

## Fase 5 — Migrasi halaman per halaman

Untuk **setiap** halaman HTML:

```
1. Identifikasi form/field + endpoint
2. Pastikan ada API JSON (tambah di Go jika belum)
3. Buat page React + pakai komponen § Fase 2
4. Wire loading / empty / error (EmptyState)
5. Test role admin vs reader
6. Cutover route di Go → SPA
7. Hapus atau dead-code template HTML halaman itu
8. Baru halaman berikutnya
```

### Prioritas

| Prioritas | Contoh |
| --- | --- |
| P0 | Dashboard, login/session |
| P1 | List + detail sederhana (read) |
| P2 | Create/edit form |
| P3 | Dangerous ops (revoke key, delete user) — konfirmasi UI jelas |

**Jangan** parallel 5 halaman sekaligus.

---

## Fase 6 — Produksi (embed / deploy)

1. `pnpm build` → `web/dist`.
2. Go: `embed.FS` dist **atau** CDN/nginx serve static + API same origin.
3. SPA fallback: path non-file → `index.html` (kecuali `/api`, `/auth`).
4. CSP / cookie `Secure` / `SameSite` dicek.
5. Hapus asset HTML/CSS lama yang tidak terpakai.
6. Smoke test: login, dashboard, satu alur write.

**Exit criteria:** satu binary/deploy Go menyajikan admin React; HTML admin lama tidak di-link dari nav.

---

## Fase 7 — Housekeeping

- [ ] README Go: cara `pnpm dev` + `go run`.
- [ ] CI: `pnpm build` + test Go.
- [ ] Rule agen tetap `alwaysApply` untuk folder `web/`.
- [ ] Design system di repo Go di-update jika token berubah (mirror client bila perlu).

---

## Apa yang di-reuse dari repo client (pantau-mala)

| Reuse | Jangan reuse |
| --- | --- |
| `docs/design-system.md` (tokens + resep) | `MapShell`, layers, heatmap |
| Pola Button / Card / Badge / EmptyState | `client-gateway.mjs` read-only |
| focusRing, tipografi, spacing | Asumsi full-viewport map |
| IBM Plex | `FE_ACCESS_MODE=client` untuk admin write |

Boleh **menyalin file komponen** lalu hapus dependensi map — lebih aman **tulis ulang tipis** dari resep di design-system (lebih sedikit coupling).

---

## Risiko & cara hindari

| Risiko | Mitigasi |
| --- | --- |
| CORS / cookie tidak kepakai | Same-origin proxy atau embed dist di Go |
| Agen terus edit HTML | Rule Fase + “no new HTML features” |
| API hanya HTML form | Tambah JSON endpoint sebelum page React |
| Big-bang rewrite | Satu route per PR |
| Brand dipakai untuk status error | Destructive = ink; risk = data saja |
| Campur admin ke repo map client | Admin di repo Go / `web/`, bukan di pantau-mala FE |

---

## Timeline kasar (1 orang)

| Fase | Estimasi |
| --- | --- |
| 0 Inventaris | 0.5 hari |
| 1 Scaffold + tokens | 0.5 hari |
| 2 Komponen minimal | 1 hari |
| 3 Auth | 1 hari |
| 4 Dashboard cutover | 0.5–1 hari |
| 5 Per halaman | 0.5–2 hari / halaman |
| 6 Produksi | 0.5 hari |

---

## Lampiran A — Rule agen (tempel di repo Go)

Simpan sebagai `.cursor/rules/admin-fe-react.mdc`:

```md
---
description: Admin FE migrates to React; do not extend HTML templates.
globs:
  - web/**/*
  - docs/design-system.md
  - docs/go-admin-react-migration.md
alwaysApply: true
---

# Admin FE — React migration

- UI admin target: React + Vite + Tailwind 4 di `web/`.
- SSOT visual: `docs/design-system.md`. Jangan mengarang hex/spacing baru.
- Jangan menambah fitur UI baru di template HTML/Go `html/template` kecuali bugfix kritis.
- Halaman baru atau perubahan UI berarti page React + komponen di `web/src`.
- Auth: session/account ke API Go. Jangan pakai client API key di browser.
- Jangan port MapLibre / GIS chrome dari repo client map.
- Migrasi strangler: satu route selesai + cutover, baru halaman berikutnya.
- Ikuti fase di `docs/go-admin-react-migration.md`. Jangan loncat ke “full rewrite”.
- Kontrol utama 44px; body 14/20; kartu radius 12 border tanpa shadow; brand hanya aksi/fokus.
```

### Prompt singkat untuk chat agen (copy-paste)

```
Kerjakan migrasi admin Go FE menurut docs/go-admin-react-migration.md.
Fase saat ini: <isi nomor fase>.
Jangan edit template HTML kecuali diperlukan untuk cutover route.
Pakai docs/design-system.md untuk semua token/visual.
Jangan tambah MapLibre. Auth lewat session Go.
Selesaikan hanya exit criteria fase ini; jangan loncat fase berikutnya.
```

---

## Lampiran B — Checklist cutover satu halaman

- [ ] API JSON siap (GET/POST/PATCH/DELETE sesuai kebutuhan)
- [ ] Page React + loading/empty/error
- [ ] Role guard
- [ ] Proxy/embed route mengarah ke SPA
- [ ] Nav lama tidak mengarah ke HTML
- [ ] Template HTML dihapus atau ditandai deprecated
- [ ] Smoke test manual / satu test e2e tipis

---

## Asal

Disusun sebagai panduan sibling dari client FE pantaumala. Implementasi aktual mengikuti struktur folder & path auth di **repo Go** — sesuaikan nama endpoint jika berbeda.
