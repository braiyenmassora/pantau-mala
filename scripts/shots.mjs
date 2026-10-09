#!/usr/bin/env node
/**
 * Visual regression screenshots (viewport 1440×900 unless noted).
 * Requires: pnpm exec playwright install chromium
 */
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'

const ROOT = new URL('..', import.meta.url).pathname
const OUT = join(ROOT, 'screenshots')
const PORT = 5173
const BASE = `http://127.0.0.1:${PORT}`

mkdirSync(OUT, { recursive: true })

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function waitForServer(url, attempts = 60) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url)
      if (res.ok || res.status === 404) return
    } catch {
      /* retry */
    }
    await wait(500)
  }
  throw new Error(`Server not ready: ${url}`)
}

const child = spawn('pnpm', ['dev', '--port', String(PORT), '--host', '127.0.0.1'], {
  cwd: ROOT,
  stdio: 'pipe',
  env: { ...process.env },
})

let shuttingDown = false
function shutdown() {
  if (shuttingDown) return
  shuttingDown = true
  child.kill('SIGTERM')
}

process.on('exit', shutdown)
process.on('SIGINT', () => {
  shutdown()
  process.exit(1)
})

try {
  await waitForServer(BASE)
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  async function shot(name) {
    await page.screenshot({ path: join(OUT, `${name}.png`), fullPage: false })
    console.log(`wrote screenshots/${name}.png`)
  }

  /** Horizontal gap between left element's right edge and right element's left (px). */
  async function assertHGap(left, right, expected, label) {
    const a = await left.boundingBox()
    const b = await right.boundingBox()
    if (!a || !b) throw new Error(`${label}: missing bounding box`)
    const gap = Math.round(b.x - (a.x + a.width))
    if (Math.abs(gap - expected) > 1) {
      throw new Error(`${label}: gap=${gap}px, expected ${expected}±1`)
    }
    console.log(`gap ok: ${label} = ${gap}px`)
  }

  async function enableLocation() {
    await page.getByRole('button', { name: 'Gunakan lokasi', exact: true }).click()
    await wait(300)
    await page.getByRole('button', { name: 'Lanjutkan', exact: true }).click()
    await wait(1200)
  }

  // 1) ringkasan awal
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await wait(1500)
  await shot('01-ringkasan')

  // icon→text gaps (summary)
  await assertHGap(
    page.getByText('Titik panas 24 jam', { exact: true }),
    page.getByRole('button', { name: 'Penjelasan titik panas' }),
    4,
    'Titik panas 24 jam → ⓘ',
  )
  {
    const chip = page.getByRole('button', { name: /^Sedang/ })
    await assertHGap(chip.locator('span').first(), chip.locator('span').nth(1), 4, 'chip Sedang dot→teks')
  }
  {
    const useBtn = page.getByRole('button', { name: 'Gunakan lokasi', exact: true })
    const card = useBtn.locator('xpath=ancestor::section[1]')
    await assertHGap(
      card.locator('span').first(),
      card.getByText('Risiko di sekitar kamu'),
      12,
      'kartu Gunakan lokasi lingkaran→teks',
    )
  }

  // search input: no own border/ring when focused (ring on wrapper)
  {
    const input = page.getByRole('textbox', { name: /Cari kabupaten/i })
    await input.focus()
    const focused = await input.evaluate((el) => {
      const s = getComputedStyle(el)
      return {
        borderStyle: s.borderTopStyle,
        borderWidth: s.borderTopWidth,
        outlineStyle: s.outlineStyle,
        outlineWidth: s.outlineWidth,
        boxShadow: s.boxShadow,
      }
    })
    const noBorder =
      focused.borderStyle === 'none' || focused.borderWidth === '0px'
    const noOutline =
      focused.outlineStyle === 'none' || focused.outlineWidth === '0px'
    if (!noBorder) {
      throw new Error(`search input border ${focused.borderStyle}/${focused.borderWidth}`)
    }
    if (!noOutline) {
      throw new Error(`search input outline ${focused.outlineStyle}/${focused.outlineWidth}`)
    }
    if (focused.boxShadow !== 'none') {
      throw new Error(`search input boxShadow ${focused.boxShadow}, want none`)
    }
    console.log('search input: no border/outline/shadow when focused')
  }

  // 2) dropdown provinsi
  await page.getByRole('button', { name: 'Pilih provinsi' }).click()
  await wait(400)
  await shot('02-dropdown-provinsi')
  await page.keyboard.press('Escape')
  await wait(200)

  // 3) chip Sangat tinggi
  const highChip = page.getByRole('button', { name: /^Sangat tinggi/ })
  await highChip.click()
  await wait(400)
  await shot('03-chip-sangat-tinggi')
  await highChip.click()
  await wait(200)

  // 4) detail Pulang Pisau (top) — panel list row, not map pin
  await page.locator('aside').getByRole('button', { name: /Pulang Pisau/i }).click()
  await wait(800)
  await shot('04-detail-pulang-pisau-top')

  // icon→text gaps (detail)
  {
    const tile = page.locator('aside').getByText('Kelembapan', { exact: true }).locator('..')
    await assertHGap(tile.locator('svg').first(), tile.getByText('Kelembapan'), 4, 'tile Kelembapan')
  }
  {
    const row = page.locator('aside h2').locator('xpath=following-sibling::p[1]')
    await assertHGap(row.locator('svg').first(), row.locator('span').first(), 4, 'kepala detail MapPin→teks')
  }

  // skor + /100 same baseline row
  {
    const sameRow = await page.locator('aside').evaluate(() => {
      const score = [...document.querySelectorAll('aside p, aside span')].find(
        (el) => el.textContent?.trim() === '82' && el.className.includes('font-mono'),
      )
      const denom = [...document.querySelectorAll('aside span')].find(
        (el) => el.textContent?.trim() === '/100',
      )
      if (!score || !denom) return { ok: false, reason: 'missing' }
      const parent = score.parentElement
      return {
        ok: parent === denom.parentElement && parent?.className.includes('items-baseline'),
        reason: parent?.className ?? '',
      }
    })
    if (!sameRow.ok) {
      throw new Error(`skor+/100 not same baseline row (${sameRow.reason})`)
    }
    console.log('risk card: skor and /100 same baseline row')
  }

  // 5) scroll + info teknis (always open)
  await page.locator('.soft-scroll').evaluate((el) => {
    el.scrollTop = el.scrollHeight
  })
  await wait(400)
  await shot('05-detail-pulang-pisau-bottom')

  // back to summary for location shot
  await page.getByRole('button', { name: 'Hapus pencarian dan pilihan' }).click()
  await wait(500)

  // 6) lokasi aktif (Pulang Pisau area)
  await page.goto(`${BASE}/?lokasi=-2.9,114.2`, { waitUntil: 'networkidle' })
  await wait(1000)
  await enableLocation()
  await shot('06-lokasi-di-sekitar-kamu')

  // 7) panel tertutup
  await page.getByRole('button', { name: /Sembunyikan panel|Tampilkan panel/ }).click()
  await wait(400)
  await shot('07-panel-tertutup')

  // 8) 1024×768
  await page.setViewportSize({ width: 1024, height: 768 })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await wait(1500)
  await shot('08-ringkasan-1024')

  // 9) filter tanpa hasil
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await wait(1200)
  await page.getByRole('button', { name: 'Pilih provinsi' }).click()
  await wait(200)
  await page.getByRole('option', { name: 'DKI Jakarta' }).click()
  await wait(400)
  await page.getByRole('button', { name: /^Sedang/ }).click()
  await wait(500)
  await shot('09-filter-kosong')

  // 10) pencarian tidak ditemukan (legacy)
  await page.getByRole('button', { name: /^Sedang/ }).click()
  await wait(200)
  await page.getByRole('button', { name: 'Pilih provinsi' }).click()
  await wait(200)
  await page.getByRole('option', { name: 'Semua provinsi' }).click()
  await wait(300)
  await page.getByPlaceholder(/Cari|kabupaten/i).fill('xyzzy-tidak-ada')
  await wait(600)
  await shot('10-pencarian-kosong')

  // 11) data gagal dimuat
  await page.route('**/wilayah.json', (route) => route.abort())
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await wait(1500)
  await shot('11-data-gagal')
  await page.unroute('**/wilayah.json')

  // 12) ringkasan mencari "dsds"
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await wait(1200)
  await page.getByPlaceholder(/Cari|kabupaten/i).fill('dsds')
  await wait(600)
  await shot('12-cari-dsds')

  // 13) lokasi Jakarta
  await page.goto(`${BASE}/?lokasi=-6.18,106.83`, { waitUntil: 'networkidle' })
  await wait(1000)
  await enableLocation()
  await shot('13-lokasi-jakarta')

  // 14) lokasi tanpa titik panas
  await page.goto(`${BASE}/?lokasi=0,120`, { waitUntil: 'networkidle' })
  await wait(1000)
  await enableLocation()
  await shot('14-lokasi-tanpa-titik-panas')

  await browser.close()
  console.log('shots: ok')
} catch (err) {
  console.error(err)
  shutdown()
  process.exit(1)
} finally {
  shutdown()
}
