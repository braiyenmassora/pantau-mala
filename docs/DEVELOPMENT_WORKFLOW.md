# Development Workflow

**Wajib dibaca sebelum membuat atau mengubah kode, konfigurasi, dokumentasi, atau deployment.**

## Branch policy

- Semua perubahan frontend dimulai dan dikerjakan di branch `develop`.
- Feature branch hanya boleh dibuat dari `develop`; jangan membuat commit atau push langsung ke `main`.
- `main` hanya menerima perubahan melalui merge dari `develop` setelah review dan verifikasi selesai.

## Mulai pekerjaan

```bash
git fetch origin
git switch develop
git pull --ff-only origin develop
```

Jika branch lokal `develop` belum ada:

```bash
git fetch origin
git switch --create develop --track origin/develop
```

Baca juga `AGENTS.md`, `README.md`, dan dokumen yang relevan dengan scope perubahan, terutama `docs/GO_API_HANDOFF.md`, `docs/api-contract.md`, `docs/DATA_COMPARISON.md`, `docs/fe-design-system.md`, dan `docs/prd-fe.md`.

## Verifikasi sebelum merge

Jalankan pemeriksaan dari root repository:

```bash
bun run lint
bun run test
bun run build
```

Untuk perubahan Worker atau gateway, lakukan juga smoke test terhadap `/frontend/session` dan endpoint data yang terdampak. Pastikan tidak ada secret di `VITE_*`, source code, `wrangler.jsonc`, atau file yang akan di-commit.

## Merge ke main

Setelah review dan semua verifikasi lulus, gunakan pull request atau alur merge berikut:

```bash
git switch main
git pull --ff-only origin main
git merge --no-ff develop
git push origin main
```

Sesudah merge, sinkronkan kembali `develop` sebelum pekerjaan berikutnya:

```bash
git switch develop
git pull --ff-only origin main
git push origin develop
```

Deployment Cloudflare Worker hanya dilakukan dari perubahan yang sudah disetujui di `main` atau release commit yang ditentukan owner. Jangan deploy perubahan eksperimen dari `develop` ke URL publik.

## Auto-deploy Cloudflare

`.github/workflows/deploy-cloudflare.yml` menjalankan pipeline deploy setelah workflow `CI` pada push ke `main` berhasil, serta melalui `workflow_dispatch`.

Jika repository memiliki konfigurasi berikut di GitHub Actions, deploy akan dijalankan secara otomatis:

- Secret `CLOUDFLARE_API_TOKEN`: API token Cloudflare khusus deployment Worker, bukan token OAuth laptop.
- Variable `CLOUDFLARE_ACCOUNT_ID`: account ID Cloudflare untuk Worker `pantaumala`.

Jika secret tersebut belum dikonfigurasi di GitHub Actions, pipeline CI tetap lulus dan langkah deploy otomatis akan dilewati (*skipped*). Deployment preview pribadi dapat dijalankan secara langsung dari laptop melalui `bun x wrangler deploy`.
