# pantau-mala-fe — working rules

## Branching and development workflow

### Versi pribadi: `lutuk/personal`

- Working copy ini adalah versi pribadi owner. Semua perubahan dikerjakan dan di-push hanya ke `lutuk/personal`.
- Jangan switch, commit, push, atau merge ke `main` maupun `develop` dari working copy ini, kecuali owner meminta secara eksplisit.
- Aturan versi pribadi ini menggantikan alur shared di bawah. Baca `docs/DEVELOPMENT_WORKFLOW.md` sebelum perubahan.
- Target preview pribadi adalah Worker `pantaumala` pada `pantaumala.ripr.workers.dev`. Deploy pribadi hanya atas permintaan owner, dari branch pribadi.
- Jangan mengubah backend/shared workspace untuk fitur pribadi tanpa persetujuan owner.

Semua kontributor, developer, dan AI agent **wajib membaca dan mematuhi alur ini sebelum membuat atau mengubah kode/konfigurasi**:

- Baca [docs/DEVELOPMENT_WORKFLOW.md](docs/DEVELOPMENT_WORKFLOW.md) terlebih dahulu.

1. **Wajib develop di branch `develop`**:
   - Setiap fitur baru, perbaikan bug, refactor, atau perubahan konfigurasi/dokumentasi harus dimulai dan dikerjakan di branch `develop` (atau feature branch yang dibuat dari `develop`).
   - Dilarang membuat commit atau push langsung ke branch `main`.
2. **Merge ke `main` secara bertahap**:
   - Perubahan hanya boleh masuk ke `main` melalui merge dari `develop` setelah seluruh linting, build, dan pengujian (`pnpm run lint`, `pnpm run build`, `pnpm run test`) lulus.
   - `main` adalah representasi release stabil/deployment publik.

## Development and deployment rules

- Gunakan pnpm untuk mengelola dependensi dan build (`pnpm-lock.yaml`).
- Pengujian dijalankan dengan `pnpm test`.
- Jangan pernah menyimpan token, API key, atau kredensial privat di file git, VITE_* environment variables, atau kode frontend.
- Gateway backend dan deployment Cloudflare Worker harus tetap mematuhi mode client read-only (`FE_ACCESS_MODE=client`).
