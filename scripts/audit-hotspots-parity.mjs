#!/usr/bin/env node
/** Audit the running FE gateway, without reading or printing API credentials. */
const counts = new Map()
const confidence = new Set(['sedang', 'tinggi'])

async function main() {
  const base = new URL(process.argv[2] ?? 'http://127.0.0.1:5173')
  if (base.username || base.password || base.pathname !== '/' || base.search || base.hash)
    throw new Error('Gunakan origin FE tanpa credentials/path/query.')
  async function get(path) {
    const response = await fetch(new URL(path, base), {
      redirect: 'error',
      signal: AbortSignal.timeout(25000),
    })
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`)
    return response.json()
  }
  const session = await get('/frontend/session')
  if (session.mode !== 'client' || session.principal?.scope !== 'data:read')
    throw new Error('Audit memerlukan gateway mode client dengan scope data:read.')
  const regions = []
  for (let offset = 0; ; offset += 1000) {
    if (offset >= 10000) throw new Error('Jumlah wilayah melebihi batas audit.')
    const page = await get(`/api/v1/regions?limit=1000&offset=${offset}`)
    if (!Array.isArray(page.data)) throw new Error('Kontrak regions: data harus array.')
    for (const region of page.data) {
      if (
        typeof region.kode !== 'string' ||
        typeof region.nama !== 'string' ||
        !Number.isInteger(region.titik_panas_24j) ||
        region.titik_panas_24j < 0
      )
        throw new Error('Kontrak regions tidak sesuai Go.')
    }
    regions.push(...page.data)
    if (page.data.length < 1000) break
  }
  const hotspots = await get('/api/v1/hotspots.geojson')
  if (hotspots.type !== 'FeatureCollection' || !Array.isArray(hotspots.features))
    throw new Error('Kontrak hotspots: FeatureCollection diperlukan.')
  for (const feature of hotspots.features) {
    const properties = feature.properties
    if (
      !properties ||
      !['rendah', 'sedang', 'tinggi'].includes(properties.keyakinan) ||
      !(properties.kode_wilayah == null || typeof properties.kode_wilayah === 'string')
    )
      throw new Error('Kontrak hotspot tidak sesuai Go.')
    if (confidence.has(properties.keyakinan) && properties.kode_wilayah)
      counts.set(properties.kode_wilayah, (counts.get(properties.kode_wilayah) ?? 0) + 1)
  }
  const status = await get('/api/v1/data-status')
  if (!status.data || !Object.hasOwn(status.data, 'diperbarui') || !status.data.sumber)
    throw new Error('Kontrak data-status tidak sesuai Go.')
  const mismatches = regions.filter(
    (region) => region.titik_panas_24j !== (counts.get(region.kode) ?? 0),
  )
  console.log(
    `Gateway client: OK; regions: ${regions.length}; features: ${hotspots.features.length}`,
  )
  console.log(`Data diperbarui: ${status.data.diperbarui ?? 'belum tersedia'}`)
  console.log(`Selisih panel/GeoJSON: ${mismatches.length} / ${regions.length}`)
  for (const region of mismatches.slice(0, 15))
    console.log(
      `${region.kode}: panel ${region.titik_panas_24j}, peta ${counts.get(region.kode) ?? 0}, dihitung ${region.dihitung ?? 'belum tersedia'}`,
    )
  if (mismatches.length) {
    console.error(
      'Periksa waktu worker/status sumber: panel dan rolling GeoJSON memakai waktu berbeda.',
    )
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(`Audit gagal: ${error.message}`)
  process.exitCode = 1
})
