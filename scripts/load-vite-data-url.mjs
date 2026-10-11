/** Isi process.env.VITE_DATA_URL dari .env* bila belum di-set (CI / Cloudflare). */
import { existsSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function readKey(file, key) {
  if (!existsSync(file)) return null
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i < 0) continue
    if (t.slice(0, i).trim() !== key) continue
    return t
      .slice(i + 1)
      .trim()
      .replace(/^['"]|['"]$/g, '')
  }
  return null
}

export function ensureViteDataUrl() {
  if (process.env.VITE_DATA_URL?.trim()) return process.env.VITE_DATA_URL.trim()
  for (const name of ['.env.production', '.env']) {
    const v = readKey(join(root, name), 'VITE_DATA_URL')
    if (v) {
      process.env.VITE_DATA_URL = v
      return v
    }
  }
  return ''
}
