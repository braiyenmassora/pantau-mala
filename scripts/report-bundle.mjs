#!/usr/bin/env node
/**
 * Report gzip sizes of dist JS chunks. Fail if entry (non-map) > 200 KB gzip.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

const distJs = join(process.cwd(), 'dist', 'assets')
const files = readdirSync(distJs).filter((f) => f.endsWith('.js'))

const rows = files.map((name) => {
  const buf = readFileSync(join(distJs, name))
  const gzip = gzipSync(buf).length
  return { name, raw: buf.length, gzip }
})
rows.sort((a, b) => b.gzip - a.gzip)

console.log('Bundle JS (gzip):')
for (const r of rows) {
  console.log(
    `  ${(r.gzip / 1024).toFixed(1).padStart(7)} KB  ${r.name}  (raw ${(r.raw / 1024).toFixed(1)} KB)`,
  )
}

/** JS needed before deferred map chunks (exclude maplibre, map-shell). */
const initial = rows.filter((r) => !/maplibre|map-shell/i.test(r.name))

const initialGzip = initial.reduce((s, r) => s + r.gzip, 0)
const LIMIT = 200 * 1024
console.log(
  `Initial JS (index*, no maplibre name): ${(initialGzip / 1024).toFixed(1)} KB gzip`,
)
if (initialGzip > LIMIT) {
  console.error(`FAIL: initial JS ${(initialGzip / 1024).toFixed(1)} KB > 200 KB gzip`)
  process.exit(1)
}
console.log('report-bundle: ok')
