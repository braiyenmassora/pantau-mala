#!/usr/bin/env node
/**
 * Salin WOFF2 IBM Plex Sans Latin dari @fontsource → public/fonts.
 * Jalankan setelah npm/pnpm install atau sebelum build.
 */
import { copyFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public/fonts')

const files = [
  [
    'node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff2',
    'ibm-plex-sans-latin-400-normal.woff2',
  ],
  [
    'node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-500-normal.woff2',
    'ibm-plex-sans-latin-500-normal.woff2',
  ],
  [
    'node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff2',
    'ibm-plex-sans-latin-600-normal.woff2',
  ],
]

mkdirSync(outDir, { recursive: true })
for (const [srcRel, name] of files) {
  const src = join(root, srcRel)
  if (!existsSync(src)) {
    console.error('sync-fonts: missing', srcRel)
    process.exit(1)
  }
  copyFileSync(src, join(outDir, name))
}
console.log(`sync-fonts: ok (${files.length} files → public/fonts)`)
