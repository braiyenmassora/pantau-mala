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

const connectSrc = `'self' https://*.basemaps.cartocdn.com https://*.cartocdn.com https://unpkg.com https://*.goatcounter.com${dataOrigin}`

const headers = `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(self)
  Content-Security-Policy: default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; script-src 'self' 'unsafe-inline' https://gc.zgo.at; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.basemaps.cartocdn.com https://*.cartocdn.com https://*.goatcounter.com; font-src 'self' data:; connect-src ${connectSrc}; worker-src 'self' blob: https://unpkg.com; child-src 'self' blob:

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/fonts/*
  Cache-Control: public, max-age=31536000, immutable

/data/*
  Cache-Control: public, max-age=300
`

writeFileSync(join(root, 'public/_headers'), headers)
console.log('write-headers: ok' + (dataOrigin ? ` (+ ${dataOrigin.trim()})` : ''))
