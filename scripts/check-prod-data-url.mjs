#!/usr/bin/env node
/** Build gagal bila VITE_DATA_URL kosong — FE hanya lewat API. */
const url = process.env.VITE_DATA_URL
if (url == null || String(url).trim() === '') {
  console.error(
    'check-prod-data-url: VITE_DATA_URL wajib di-set (base URL API, tanpa slash akhir).',
  )
  process.exit(1)
}
