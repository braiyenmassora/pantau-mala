import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const cache = join(tmpdir(), 'pantau-mala-osm-boundaries')
const endpoint = 'https://nominatim.openstreetmap.org/search'
// Province polygons are an overview interaction layer, not survey geometry.
// ~500 m keeps coastlines recognizable while avoiding 100k+ WebGL vertices.
const threshold = '0.005'
const provinces = [
  ['Aceh'],
  ['Sumatera Utara'],
  ['Sumatera Barat'],
  ['Riau'],
  ['Jambi'],
  ['Sumatera Selatan'],
  ['Bengkulu'],
  ['Lampung'],
  ['Kepulauan Bangka Belitung', 'Bangka Belitung'],
  ['Kepulauan Riau'],
  ['DKI Jakarta', 'Jakarta', 'Daerah Khusus Jakarta', 'Daerah Khusus Ibukota Jakarta'],
  ['Jawa Barat'],
  ['Jawa Tengah'],
  ['Daerah Istimewa Yogyakarta', 'Yogyakarta'],
  ['Jawa Timur'],
  ['Banten'],
  ['Bali'],
  ['Nusa Tenggara Barat'],
  ['Nusa Tenggara Timur'],
  ['Kalimantan Barat'],
  ['Kalimantan Tengah'],
  ['Kalimantan Selatan'],
  ['Kalimantan Timur'],
  ['Kalimantan Utara'],
  ['Sulawesi Utara'],
  ['Sulawesi Tengah'],
  ['Sulawesi Selatan'],
  ['Sulawesi Tenggara'],
  ['Gorontalo'],
  ['Sulawesi Barat'],
  ['Maluku'],
  ['Maluku Utara'],
  ['Papua Barat'],
  ['Papua Barat Daya'],
  ['Papua'],
  ['Papua Selatan'],
  ['Papua Tengah'],
  ['Papua Pegunungan'],
]

function validateGeometry(geometry) {
  const polygons =
    geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates
  if (!['Polygon', 'MultiPolygon'].includes(geometry.type) || !polygons.length) {
    throw new Error('Boundary must be a nonempty Polygon or MultiPolygon.')
  }
  for (const polygon of polygons) {
    if (!polygon.length) throw new Error('Empty boundary polygon.')
    for (const ring of polygon) {
      if (ring.length < 4) throw new Error('Boundary ring is too short.')
      for (const [longitude, latitude] of ring) {
        if (
          !Number.isFinite(longitude) ||
          !Number.isFinite(latitude) ||
          longitude < 90 ||
          longitude > 145 ||
          latitude < -15 ||
          latitude > 10
        ) {
          throw new Error(
            'Boundary coordinate is outside the expected Indonesian extent.',
          )
        }
      }
      const first = ring[0]
      const last = ring.at(-1)
      if (first[0] !== last[0] || first[1] !== last[1])
        throw new Error('Boundary ring is not closed.')
    }
  }
}

await mkdir(cache, { recursive: true })
const features = []
const records = []
for (const [name, ...aliases] of provinces) {
  const url = new URL(endpoint)
  url.search = new URLSearchParams({
    state: name,
    country: 'Indonesia',
    countrycodes: 'id',
    format: 'geojson',
    polygon_geojson: '1',
    polygon_threshold: threshold,
    extratags: '1',
    'accept-language': 'id',
    limit: '3',
  }).toString()
  const cacheFile = join(cache, `${name.replaceAll(' ', '-')}.json`)
  let saved
  try {
    saved = JSON.parse(await readFile(cacheFile, 'utf8'))
    if (saved.url !== url.href || process.argv.includes('--refresh')) saved = null
  } catch {
    saved = null
  }
  if (!saved) {
    await delay(1100)
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'PantauMala/1.0 boundary-snapshot (https://github.com/braiyenmassora/pantau-mala)',
      },
      signal: AbortSignal.timeout(45000),
    })
    if (!response.ok) throw new Error(`${name}: Nominatim returned ${response.status}.`)
    saved = {
      url: url.href,
      retrieved_at: new Date().toISOString(),
      data: await response.json(),
    }
    await writeFile(cacheFile, JSON.stringify(saved))
  }
  const matches = saved.data.features.filter((feature) => {
    const properties = feature.properties
    return (
      properties.osm_type === 'relation' &&
      properties.extratags?.admin_level === '4' &&
      [name, ...aliases].some(
        (candidate) => candidate.toLowerCase() === properties.name.toLowerCase(),
      )
    )
  })
  if (matches.length !== 1)
    throw new Error(
      `${name}: expected one verified province relation, found ${matches.length}.`,
    )
  const feature = matches[0]
  validateGeometry(feature.geometry)
  const id = String(feature.properties.osm_id)
  if (features.some((existing) => existing.id === id))
    throw new Error(`${name}: duplicate OSM relation ${id}.`)
  const hash = createHash('sha256').update(JSON.stringify(saved.data)).digest('hex')
  features.push({
    type: 'Feature',
    id,
    properties: { province_id: id, province_name: name },
    geometry: feature.geometry,
  })
  records.push({
    id,
    name,
    osm_name: feature.properties.name,
    osm_relation: `https://www.openstreetmap.org/relation/${id}`,
    retrieved_at: saved.retrieved_at,
    query: saved.url,
    response_sha256: hash,
  })
  console.log(`${records.length}/${provinces.length} ${name}: relation/${id}`)
}

const geometry = `${JSON.stringify({ type: 'FeatureCollection', features })}\n`
const sha256 = createHash('sha256').update(geometry).digest('hex')
const manifest = {
  version: 1,
  source: 'OpenStreetMap contributors / Nominatim',
  license: 'ODbL-1.0',
  license_url: 'https://www.openstreetmap.org/copyright',
  generated_at: new Date().toISOString(),
  simplification_degrees: Number(threshold),
  geometry: `/data/indonesia-provinces.geojson?v=${sha256.slice(0, 16)}`,
  geometry_sha256: sha256,
  provinces: records,
}
await writeFile(join(root, 'public/data/indonesia-provinces.geojson'), geometry)
await writeFile(
  join(root, 'public/data/indonesia-provinces.meta.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
)
console.log(
  `Saved ${features.length} provinces, ${Buffer.byteLength(geometry)} bytes, sha256 ${sha256}.`,
)
