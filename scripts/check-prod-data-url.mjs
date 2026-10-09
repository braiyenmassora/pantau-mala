#!/usr/bin/env node
/** Production builds must set VITE_DATA_URL (empty = dummy; never ship that). */
const url = process.env.VITE_DATA_URL
if (url == null || String(url).trim() === '') {
  console.error(
    'check-prod-data-url: VITE_DATA_URL kosong — build produksi ditolak (mode data contoh).',
  )
  process.exit(1)
}
