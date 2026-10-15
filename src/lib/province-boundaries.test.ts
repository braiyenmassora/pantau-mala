import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  decodeProvinceBoundaries,
  normalizeProvinceName,
  provinceBoundaryManifestSchema,
} from '@/lib/province-boundaries'

describe('normalizeProvinceName', () => {
  it('normalizes common spelling variations and prefixes', () => {
    expect(normalizeProvinceName('DI Aceh')).toBe('ACEH')
    expect(normalizeProvinceName('Nanggroe Aceh Darussalam')).toBe('ACEH')
    expect(normalizeProvinceName('Bangka Belitung')).toBe('KEPULAUAN BANGKA BELITUNG')
    expect(normalizeProvinceName('DI Yogyakarta')).toBe('DAERAH ISTIMEWA YOGYAKARTA')
    expect(normalizeProvinceName('D.I. Yogyakarta')).toBe('DAERAH ISTIMEWA YOGYAKARTA')
    expect(normalizeProvinceName('Yogyakarta')).toBe('DAERAH ISTIMEWA YOGYAKARTA')
    expect(normalizeProvinceName('Jakarta')).toBe('DKI JAKARTA')
    expect(normalizeProvinceName('Daerah Khusus Jakarta')).toBe('DKI JAKARTA')
    expect(normalizeProvinceName('Provinsi Kalimantan Barat')).toBe('KALIMANTAN BARAT')
    expect(normalizeProvinceName('Kalimantan Tengah')).toBe('KALIMANTAN TENGAH')
    expect(normalizeProvinceName('  Provinsi Kalimantan Barat  ')).toBe(
      'KALIMANTAN BARAT',
    )
    expect(normalizeProvinceName('Papua Barat Daya')).not.toBe(
      normalizeProvinceName('Papua Barat'),
    )
    expect(normalizeProvinceName('Papua Tengah')).not.toBe(normalizeProvinceName('Papua'))
  })
})

describe('provinceBoundaryManifestSchema', () => {
  it('validates the checked-in 38-province metadata manifest from public/data', () => {
    const raw = readFileSync(
      join(process.cwd(), 'public/data/indonesia-provinces.meta.json'),
      'utf8',
    )
    const parsed = JSON.parse(raw)
    const result = provinceBoundaryManifestSchema.safeParse(parsed)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.provinces).toHaveLength(38)
      expect(result.data.version).toBe(1)
      expect(result.data.geometry).toMatch(
        /^\/data\/indonesia-provinces\.geojson\?v=[a-f0-9]{16}$/,
      )
    }
  })

  it('rejects manifest when geometry hash mismatch', () => {
    const manifest = {
      version: 1,
      geometry: '/data/indonesia-provinces.geojson?v=0000000000000000',
      geometry_sha256: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
      provinces: Array.from({ length: 38 }, (_, i) => ({
        id: String(i + 1),
        name: `Provinsi ${i + 1}`,
      })),
    }
    const result = provinceBoundaryManifestSchema.safeParse(manifest)
    expect(result.success).toBe(false)
  })

  it('rejects manifest when count is not 38', () => {
    const manifest = {
      version: 1,
      geometry: '/data/indonesia-provinces.geojson?v=ffffffffffffffff',
      geometry_sha256: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
      provinces: [
        { id: '1', name: 'Aceh' },
        { id: '2', name: 'Sumatera Utara' },
      ],
    }
    const result = provinceBoundaryManifestSchema.safeParse(manifest)
    expect(result.success).toBe(false)
  })
})

describe('decodeProvinceBoundaries', () => {
  const manifest = provinceBoundaryManifestSchema.parse(
    JSON.parse(
      readFileSync(
        join(process.cwd(), 'public/data/indonesia-provinces.meta.json'),
        'utf8',
      ),
    ),
  )
  const snapshot = JSON.parse(
    readFileSync(join(process.cwd(), 'public/data/indonesia-provinces.geojson'), 'utf8'),
  )

  it('validates polygon rings and all identities in the checked-in geometry', () => {
    expect(decodeProvinceBoundaries(snapshot, manifest).features).toHaveLength(38)
  })

  it('rejects an unclosed ring', () => {
    const changed = structuredClone(snapshot)
    const geometry = changed.features[0].geometry
    const ring =
      geometry.type === 'Polygon' ? geometry.coordinates[0] : geometry.coordinates[0][0]
    ring.pop()
    expect(() => decodeProvinceBoundaries(changed, manifest)).toThrow()
  })

  it('rejects duplicated provinces even when feature count is unchanged', () => {
    const changed = { ...snapshot, features: [...snapshot.features] }
    changed.features[1] = changed.features[0]
    expect(() => decodeProvinceBoundaries(changed, manifest)).toThrow('Identitas')
  })

  it('rejects mismatched names and identities', () => {
    const changed = structuredClone(snapshot)
    changed.features[0].properties.province_name = 'Papua'
    expect(() => decodeProvinceBoundaries(changed, manifest)).toThrow('Identitas')
  })

  it('rejects missing provinces', () => {
    expect(() =>
      decodeProvinceBoundaries(
        {
          ...snapshot,
          features: snapshot.features.slice(1),
        },
        manifest,
      ),
    ).toThrow('tidak lengkap')
  })
})
