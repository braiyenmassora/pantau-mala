#!/usr/bin/env node
/**
 * axe-core scans on main views — fail on any violation.
 */
import { spawn } from 'node:child_process'
import AxeBuilder from '@axe-core/playwright'
import { chromium } from 'playwright'
import { installGoFixtures } from './browser-fixtures.mjs'

const PORT = 5176
const BASE = `http://127.0.0.1:${PORT}`
const ROOT = new URL('..', import.meta.url).pathname

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

async function scan(page, label) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  if (results.violations.length > 0) {
    const detail = results.violations
      .map(
        (v) =>
          `${v.id} (${v.impact}): ${v.help}\n` +
          v.nodes
            .slice(0, 3)
            .map((n) => `  - ${n.target.join(' ')}`)
            .join('\n'),
      )
      .join('\n')
    throw new Error(`axe violations on ${label}:\n${detail}`)
  }
  console.log(`axe ok: ${label}`)
}

const child = spawn(
  'pnpm',
  ['exec', 'vite', '--port', String(PORT), '--host', '127.0.0.1'],
  {
    cwd: ROOT,
    stdio: 'pipe',
    env: { ...process.env },
  },
)

function shutdown() {
  child.kill('SIGTERM')
}

process.on('exit', shutdown)

try {
  await waitForServer(BASE)
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH,
    args: ['--enable-unsafe-swiftshader'],
  })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  })
  await installGoFixtures(context, false)
  const page = await context.newPage()

  await page.goto(BASE, { waitUntil: 'networkidle' })
  await wait(1500)
  await page.locator('#username').waitFor()
  await scan(page, 'login')
  await page.locator('#username').fill('fixture')
  await page.locator('#password').fill('synthetic-password')
  await page.getByRole('button', { name: 'Masuk', exact: true }).click()
  await page.getByRole('button', { name: 'Keluar', exact: true }).waitFor()
  await wait(500)
  await scan(page, 'home summary')

  await page.getByRole('button', { name: 'Pilih provinsi' }).click()
  await wait(400)
  await scan(page, 'province dropdown open')
  await page.keyboard.press('Escape')
  await wait(200)

  await page
    .getByRole('button', { name: /Sangat tinggi/ })
    .first()
    .click()
  await wait(300)
  await scan(page, 'category filter')

  await page.getByLabel('Cari kabupaten/kota').fill('pulang')
  await wait(600)
  await scan(page, 'search results')

  await page
    .locator('aside')
    .getByRole('button', { name: /Pulang Pisau/i })
    .first()
    .click()
  await wait(800)
  await scan(page, 'region detail')

  // Escape #1: detail wilayah → panel provinsi; #2: provinsi → beranda (search).
  await page.keyboard.press('Escape')
  await wait(300)
  await page.keyboard.press('Escape')
  await wait(400)

  await page.getByLabel('Cari kabupaten/kota').fill('')
  await page.getByRole('button', { name: 'Gunakan lokasi kamu' }).click()
  await wait(400)
  await scan(page, 'location prompt')

  await browser.close()
  console.log('a11y-check: ok')
  process.exit(0)
} catch (err) {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
} finally {
  shutdown()
}
