#!/usr/bin/env node
/**
 * Layout non-overlap checks at key viewports (no screenshots).
 */
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'
import { installGoFixtures } from './browser-fixtures.mjs'

const PORT = 5174
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

function overlaps(a, b) {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  )
}

const child = spawn('bun', ['run', '--bun', 'dev', '--port', String(PORT), '--host', '127.0.0.1'], {
  cwd: ROOT,
  stdio: 'pipe',
  env: { ...process.env },
})

function shutdown() {
  child.kill('SIGTERM')
}

process.on('exit', shutdown)

const viewports = [
  { w: 1024, h: 700 },
  { w: 1024, h: 900 },
  { w: 1280, h: 900 },
  { w: 1440, h: 900 },
  { w: 1920, h: 900 },
  { w: 1440, h: 700 },
]

try {
  await waitForServer(BASE)
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH,
    args: ['--enable-unsafe-swiftshader'],
  })
  const context = await browser.newContext()
  await installGoFixtures(context)
  const page = await context.newPage()

  for (const { w, h } of viewports) {
    await page.setViewportSize({ width: w, height: h })
    await page.goto(BASE, { waitUntil: 'networkidle' })
    await wait(1200)

    const boxes = await page.evaluate(() => {
      const pick = (sel) => {
        const el = document.querySelector(sel)
        if (!el) return null
        const r = el.getBoundingClientRect()
        return { x: r.x, y: r.y, width: r.width, height: r.height }
      }
      return {
        aside: pick('aside'),
        legend: pick('[data-testid="map-legend"]'),
        controls: pick('[data-testid="map-controls"]'),
        updated: pick('[data-testid="updated-at"]'),
      }
    })

    if (boxes.aside && boxes.legend && overlaps(boxes.aside, boxes.legend)) {
      throw new Error(`${w}x${h}: panel overlaps legend`)
    }
    if (boxes.legend && boxes.controls && overlaps(boxes.legend, boxes.controls)) {
      throw new Error(`${w}x${h}: legend overlaps map controls`)
    }
    if (boxes.controls && boxes.updated && overlaps(boxes.controls, boxes.updated)) {
      throw new Error(`${w}x${h}: controls overlap updated-at`)
    }

    const scrollOk = await page.locator('aside .soft-scroll').evaluate((el) => {
      return el.scrollHeight >= el.clientHeight
    })
    if (!scrollOk && h < 500) {
      throw new Error(`${w}x${h}: panel scroll area unexpected`)
    }

    console.log(`layout ok: ${w}x${h}`)
  }

  // Long name truncation smoke (title present on row)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await wait(800)
  await page.getByPlaceholder(/Cari/).fill('Pulang')
  await wait(500)
  const titled = await page.locator('aside [title*="Pulang"]').count()
  if (titled < 1) throw new Error('expected title attribute on truncated region name')
  console.log('ellipsis title ok')

  await browser.close()
  console.log('layout-check: ok')
} catch (err) {
  console.error(err)
  shutdown()
  process.exit(1)
} finally {
  shutdown()
}
