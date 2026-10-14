#!/usr/bin/env node
/** Panel hotspots_24h vs map GeoJSON count (sedang+tinggi). See docs/fe-be-sync-prompt.json */
const base = (process.argv[2] ?? process.env.VITE_DATA_URL ?? '').replace(/\/$/, '')
if (!base) {
  console.error('Usage: VITE_DATA_URL=http://127.0.0.1:8080 pnpm audit:parity')
  console.error('   or: node scripts/audit-hotspots-parity.mjs http://127.0.0.1:8080')
  process.exit(2)
}

const MAP_CONF = new Set(['sedang', 'tinggi'])

function countForCode(features, code) {
  let n = 0
  for (const f of features) {
    const p = f.properties ?? {}
    if (p.region_code !== code) continue
    if (!MAP_CONF.has(p.confidence)) continue
    n++
  }
  return n
}

const health = await fetch(`${base}/health`)
if (!health.ok) {
  console.error(`${base}/health → ${health.status}`)
  process.exit(1)
}

const [regions, hotspots] = await Promise.all([
  fetch(`${base}/v1/regions`).then((r) => r.json()),
  fetch(`${base}/v1/hotspots`).then((r) => r.json()),
])

const features = hotspots.features ?? []
const mismatches = []
for (const r of regions) {
  const n = countForCode(features, r.code)
  if (n !== r.hotspots_24h) {
    mismatches.push({
      code: r.code,
      name: r.name,
      hotspots_24h: r.hotspots_24h,
      geojson_sedang_tinggi: n,
      delta: r.hotspots_24h - n,
    })
  }
}

mismatches.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))

console.log(`API: ${base}`)
console.log(`regions: ${regions.length}, features: ${features.length}`)
console.log(`mismatch: ${mismatches.length} / ${regions.length}`)

for (const m of mismatches.slice(0, 15)) {
  console.log(`  ${m.name} (${m.code}): BE ${m.hotspots_24h} vs geojson ${m.geojson_sedang_tinggi}`)
}

process.exit(mismatches.length > 0 ? 1 : 0)
