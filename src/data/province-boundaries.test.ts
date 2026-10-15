import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { fetchProvinceBoundaries } from '@/data/province-boundaries'

const manifest = JSON.parse(
  readFileSync(join(process.cwd(), 'public/data/indonesia-provinces.meta.json'), 'utf8'),
)
const geometry = readFileSync(
  join(process.cwd(), 'public/data/indonesia-provinces.geojson'),
  'utf8',
)

describe('fetchProvinceBoundaries', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('loads the same-origin snapshot, verifies its hash, and forwards cancellation', async () => {
    const controller = new AbortController()
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(Response.json(manifest))
      .mockResolvedValueOnce(new Response(geometry))
    vi.stubGlobal('fetch', fetch)

    const result = await fetchProvinceBoundaries(controller.signal)

    expect(result.geometry.features).toHaveLength(38)
    expect(fetch).toHaveBeenNthCalledWith(1, '/data/indonesia-provinces.meta.json', {
      signal: controller.signal,
    })
    expect(fetch).toHaveBeenNthCalledWith(2, manifest.geometry, {
      signal: controller.signal,
    })
  })

  it('rejects a changed or stale snapshot instead of rendering mismatched geometry', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(Response.json(manifest))
        .mockResolvedValueOnce(new Response(`${geometry} `)),
    )

    await expect(fetchProvinceBoundaries()).rejects.toThrow('Revisi batas provinsi')
  })

  it('fails clearly when the manifest is unavailable', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 404 }))
    vi.stubGlobal('fetch', fetch)

    await expect(fetchProvinceBoundaries()).rejects.toThrow('Metadata batas provinsi')
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('fails clearly when geometry is unavailable', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(Response.json(manifest))
        .mockResolvedValueOnce(new Response(null, { status: 404 })),
    )

    await expect(fetchProvinceBoundaries()).rejects.toThrow('Geometri batas provinsi')
  })
})
