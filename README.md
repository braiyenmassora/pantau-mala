# pantaumala

Satellite hotspot monitoring map for Indonesia. Not a fire confirmation or official warning.

## Tech Stack

| Technology         | Notes                           |
| ------------------ | ------------------------------- |
| Vite               | 8                               |
| React              | 19.2                            |
| TypeScript         | 6                               |
| Tailwind CSS       | 4                               |
| MapLibre GL        | 6                               |
| TanStack Query     | 5                               |
| Zustand            | 5                               |
| Zod                | 4                               |
| Lucide React       | 1.53                            |
| Vitest             | 5                               |
| Cloudflare Workers | Hosting & deployment (Wrangler) |

## Getting Started

Clone the repository

```bash
git clone https://github.com/braiyenmassora/pantau-mala.git
cd pantau-mala
```

Install dependencies

```bash
pnpm install --frozen-lockfile
```

Setup environment

```bash
cp .env.example .env
```

```env
VITE_DATA_URL=
FE_ACCESS_MODE=
PANTAU_API_ORIGIN=
PANTAU_CLIENT_SLUG=
PANTAU_API_KEY=
HOST=
PORT=
```

Run the development server

```bash
pnpm run dev
```

Open http://127.0.0.1:5173/
