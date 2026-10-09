#!/usr/bin/env node
/**
 * Production / CI builds must set VITE_DATA_URL (empty = dummy; never ship that).
 * Local mockup builds skip this when CI is unset.
 */
const url = process.env.VITE_DATA_URL
const empty = url == null || String(url).trim() === ''
if (empty && process.env.CI) {
  console.error(
    'check-prod-data-url: VITE_DATA_URL kosong — build produksi di CI ditolak (mode data contoh).',
  )
  process.exit(1)
}
