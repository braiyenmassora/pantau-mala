#!/usr/bin/env node
/** Build gagal bila VITE_DATA_URL kosong — FE hanya lewat API. */
import { ensureViteDataUrl } from './load-vite-data-url.mjs'

const url = ensureViteDataUrl()
if (url !== '/api/v1') {
  console.error(
    'check-prod-data-url: VITE_DATA_URL harus /api/v1 dengan proxy API/auth pada origin FE.',
  )
  process.exit(1)
}
