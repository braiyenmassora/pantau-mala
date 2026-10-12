import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { decodeRegions, decodeHotspots, decodeMeta, decodeCatalog } from './go-contract'
import { summarySchema, historySchema } from './extended-contract'
// Explicit opt-in dev contract check. Never credentials or a browser test in CI.
describe.skipIf(!process.env.PANTAU_DEV_TEST_CONFIG)(
  'existing Go dev API contract',
  () => {
    it('validates live client-scoped business responses and logout revocation', async () => {
      const path = process.env.PANTAU_DEV_TEST_CONFIG!
      const credentials = JSON.parse(readFileSync(path, 'utf8')) as {
        username: string
        password: string
      }
      const base = 'http://127.0.0.1:8080'
      const login = await fetch(base + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password,
        }),
      })
      expect(login.status).toBe(200)
      const session = (await login.json()) as { token: string }
      const headers = { Authorization: `Bearer ${session.token}` }
      async function get(path: string) {
        const res = await fetch(base + path, { headers })
        expect(res.status).toBe(200)
        return res.json() as Promise<unknown>
      }
      try {
        const catalog = decodeCatalog(await get('/api/v1/region-catalog'))
        expect(catalog.regencies.length).toBeGreaterThan(0)
        const regions = decodeRegions(await get('/api/v1/regions?limit=1000'))
        expect(regions.length).toBeGreaterThan(0)
        const features = decodeHotspots(await get('/api/v1/hotspots.geojson'))
        expect(features.type).toBe('FeatureCollection')
        const meta = decodeMeta(await get('/api/v1/data-status'))
        expect(meta.status.firms).toMatch(/ok|gagal|terlambat/)
        expect(
          summarySchema.parse(await get('/api/v1/summary')).data.tren_7h,
        ).toHaveLength(7)
        expect(
          historySchema.parse(await get(`/api/v1/regions/${regions[0].code}/history`))
            .data,
        ).toHaveLength(7)
        const anon = await fetch(base + '/api/v1/region-catalog')
        expect(anon.status).toBe(401)
      } finally {
        const logout = await fetch(base + '/auth/logout', { method: 'POST', headers })
        expect(logout.status).toBe(204)
      }
      expect((await fetch(base + '/auth/me', { headers })).status).toBe(401)
    }, 60000)
  },
)
