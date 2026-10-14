# pantau-mala-fe — working rules

## Branching and development workflow

Semua kontributor, developer, dan AI agent **wajib membaca dan mematuhi alur ini sebelum membuat atau mengubah kode/konfigurasi**:

- Baca [docs/DEVELOPMENT_WORKFLOW.md](docs/DEVELOPMENT_WORKFLOW.md) terlebih dahulu.

1. **Wajib develop di branch `develop`**:
   - Setiap fitur baru, perbaikan bug, refactor, atau perubahan konfigurasi/dokumentasi harus dimulai dan dikerjakan di branch `develop` (atau feature branch yang dibuat dari `develop`).
   - Dilarang membuat commit atau push langsung ke branch `main`.
2. **Merge ke `main` secara bertahap**:
   - Perubahan hanya boleh masuk ke `main` melalui merge dari `develop` setelah seluruh linting, build, dan pengujian (`bun run lint`, `bun run build`, `bun run test`) lulus.
   - `main` adalah representasi release stabil/deployment publik.

## Development and deployment rules

- Gunakan Bun untuk mengelola dependensi dan build (`bun.lock`).
- Pengujian dijalankan dengan `bun run test`.
- Jangan pernah menyimpan token, API key, atau kredensial privat di file git, VITE_* environment variables, atau kode frontend.
- Gateway backend dan deployment Cloudflare Worker harus tetap mematuhi mode client read-only (`FE_ACCESS_MODE=client`).
