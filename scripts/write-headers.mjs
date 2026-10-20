#!/usr/bin/env node
/**
 * Writes public/_headers for Cloudflare Pages.
 * Extends connect-src with VITE_DATA_URL origin when it is an absolute URL.
 */
import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { ensureViteDataUrl } from './load-vite-data-url.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dataUrl = ensureViteDataUrl()

let dataOrigin = ''
if (/^https?:\/\//i.test(dataUrl)) {
  try {
    dataOrigin = ` ${new URL(dataUrl).origin}`
  } catch {
    console.error('write-headers: invalid VITE_DATA_URL', dataUrl)
    process.exit(1)
  }
}

const r2UploadOrigin = 'https://840ff00b21969ff808e3b4fca131d95c.r2.cloudflarestorage.com'
const r2PublicOrigin = 'https://pub-32d942c9574c4f02a9c7fb2e260e33e2.r2.dev'
const connectSrc = `'self' https://*.basemaps.cartocdn.com https://*.cartocdn.com ${r2UploadOrigin}${dataOrigin}`

const headers = `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(self)
  Content-Security-Policy: default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.basemaps.cartocdn.com https://*.cartocdn.com ${r2PublicOrigin}; font-src 'self' data:; connect-src ${connectSrc}; worker-src 'self' blob:; child-src 'self' blob:

/sw.js
  Cache-Control: public, max-age=0, must-revalidate

/manifest.webmanifest
  Cache-Control: public, max-age=86400

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/data/*
  Cache-Control: public, max-age=300
`

writeFileSync(join(root, 'public/_headers'), headers)
console.log('write-headers: ok' + (dataOrigin ? ` (+ ${dataOrigin.trim()})` : ''))
