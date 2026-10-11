#!/usr/bin/env node
/** Build gagal bila VITE_DATA_URL kosong — FE hanya lewat API. */
import { ensureViteDataUrl } from './load-vite-data-url.mjs'

const url = ensureViteDataUrl()
if (!url) {
  console.error(
    'check-prod-data-url: VITE_DATA_URL wajib di-set (base URL API, tanpa slash akhir).',
  )
  process.exit(1)
}
