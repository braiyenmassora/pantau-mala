/** Path shareable: `/wilayah/{slug}-{kode4}` — kode tanpa titik (hindari dianggap file). */

export const WILAYAH_PATH_PREFIX = '/wilayah'

export type ParsedWilayahPath =
  | { kind: 'home' }
  | { kind: 'wilayah'; slug: string; code: string; pathCode: string }
  | { kind: 'invalid' }

/** `62.11` → `6211`. Hanya format BPS kab/kota NN.NN. */
export function toPathCode(code: string): string | null {
  const m = /^(\d{2})\.(\d{2})$/.exec(code.trim())
  return m ? `${m[1]}${m[2]}` : null
}

/** `6211` → `62.11`. */
export function fromPathCode(pathCode: string): string | null {
  const m = /^(\d{2})(\d{2})$/.exec(pathCode.trim())
  return m ? `${m[1]}.${m[2]}` : null
}

/** Nama wilayah → slug URL (ASCII, strip aksen). */
export function slugifyWilayah(name: string): string {
  const slug = name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
  return slug || 'wilayah'
}

export function buildWilayahPath(name: string, code: string): string | null {
  const pathCode = toPathCode(code)
  if (!pathCode) return null
  return `${WILAYAH_PATH_PREFIX}/${slugifyWilayah(name)}-${pathCode}`
}

export function parseWilayahPath(pathname: string): ParsedWilayahPath {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (path === '/') return { kind: 'home' }
  if (path === WILAYAH_PATH_PREFIX) return { kind: 'invalid' }

  const prefix = `${WILAYAH_PATH_PREFIX}/`
  if (!path.startsWith(prefix)) return { kind: 'home' }

  const rest = path.slice(prefix.length)
  const m = /^(.+)-(\d{4})$/.exec(rest)
  if (!m) return { kind: 'invalid' }

  const code = fromPathCode(m[2])
  if (!code) return { kind: 'invalid' }

  return { kind: 'wilayah', slug: m[1], code, pathCode: m[2] }
}

/** True bila path mengandung `.` di segmen terakhir — berisiko dianggap aset. */
export function pathLooksLikeStaticAsset(pathname: string): boolean {
  const last = pathname.split('/').pop() ?? ''
  return last.includes('.')
}
