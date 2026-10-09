# forever-young

Aplikasi web indikator kebakaran hutan dan lahan (karhutla) di Indonesia: peta titik panas, skor risiko per kabupaten/kota, cuaca, dan kualitas udara.

## Stack

Vite · React · TypeScript · Tailwind CSS · shadcn/ui · mapcn (MapLibre)

## Mulai

```bash
pnpm install
pnpm dev
```

## Struktur

```
src/
├─ components/
│  ├─ ui/       # shadcn + mapcn
│  ├─ map/      # pin, cluster, halo, kontrol
│  └─ panel/    # ringkasan, daftar, detail
├─ data/        # types + TanStack Query hooks
├─ store/       # Zustand (ui, peta)
├─ lib/         # filter, ringkasan, format, kategori
└─ styles/      # tokens.css
public/data/    # wilayah.json, titik-panas-24j.geojson, meta.json
docs/           # PRD + spesifikasi UI
```

## Acuan

- [Spesifikasi UI](docs/spesifikasi-ui.md)
- [PRD ringkas](docs/prd-ringkas.md)
- [PRD](docs/prd.md)
