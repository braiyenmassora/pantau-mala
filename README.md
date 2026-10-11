# forever-young

Peta titik panas satelit dan risiko per kabupaten/kota di Indonesia (NASA FIRMS + Open-Meteo + FWI dihitung). Titik panas ≠ kebakaran; bukan peringatan resmi.

## Stack

Vite · React · TypeScript · Tailwind CSS · shadcn/ui · mapcn (MapLibre)

## Mulai

```bash
cp .env.example .env   # set VITE_DATA_URL ke API
pnpm install
pnpm dev
```

`VITE_DATA_URL` wajib (tanpa slash akhir). Tidak ada mode dummy lokal.

## Struktur

```
src/
├─ components/
│  ├─ ui/       # shadcn + mapcn
│  ├─ map/      # pin, halo, kontrol
│  └─ panel/    # ringkasan, daftar, detail
├─ data/        # types + TanStack Query hooks
├─ store/       # Zustand (ui, peta)
├─ lib/         # filter, ringkasan, format, kategori
└─ styles/      # tokens.css
docs/           # handoff FE + copy + spek flag
```

## Acuan

- [Handoff FE v2.3](docs/prd-fe.md)
- [UI copy / ikon / tooltip](docs/fe-ui-copy.md)
- [Spek flag pin](docs/spek-flag-deteksi.md)
