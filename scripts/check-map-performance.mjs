#!/usr/bin/env node
import { chromium } from 'playwright'

const target =
  process.argv.slice(2).find((argument) => /^https?:\/\//.test(argument)) ||
  'http://127.0.0.1:5173'
const sampleSize = 90

function summarize(frames) {
  const sorted = [...frames].sort((a, b) => a - b)
  return {
    p50: Number(sorted[Math.floor(sampleSize * 0.5)].toFixed(1)),
    p95: Number(sorted[Math.floor(sampleSize * 0.95)].toFixed(1)),
    max: Number(Math.max(...frames).toFixed(1)),
    over32: frames.filter((duration) => duration > 32).length,
  }
}

const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'no-preference',
  })
  const page = await context.newPage()
  const pageErrors = []
  page.on('pageerror', (error) => pageErrors.push(error.message))

  await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 30_000 })
  await page.waitForSelector('.maplibregl-canvas', { timeout: 30_000 })
  await page.waitForTimeout(10_000)

  const measure = async (move) => {
    const bounds = await page.locator('.maplibregl-canvas').boundingBox()
    const probe = page.evaluate(
      async (size) =>
        new Promise((resolve) => {
          const frames = []
          let previous = performance.now()
          function frame(now) {
            frames.push(now - previous)
            previous = now
            if (frames.length >= size) resolve(frames)
            else requestAnimationFrame(frame)
          }
          requestAnimationFrame(frame)
        }),
      sampleSize,
    )
    if (move && bounds) {
      await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
      for (let step = 0; step < 16; step += 1) {
        await page.mouse.wheel(0, -120)
        await page.waitForTimeout(30)
      }
    }
    return summarize(await probe)
  }

  const idle = await measure(false)
  const zoom = await measure(true)
  const runtime = await page.evaluate(() => {
    const canvas = document.querySelector('.maplibregl-canvas')
    return {
      canvasWidth: canvas?.width ?? 0,
      externalWorker: performance
        .getEntriesByType('resource')
        .some((entry) => entry.name.includes('unpkg.com/maplibre-gl')),
    }
  })
  const result = { target, idle, zoom, runtime, pageErrors }
  console.log(JSON.stringify(result, null, 2))

  if (
    pageErrors.length > 0 ||
    runtime.canvasWidth > 390 ||
    runtime.externalWorker ||
    idle.p50 > 25 ||
    zoom.p50 > 25
  ) {
    process.exitCode = 1
  }
} finally {
  await browser.close()
}
