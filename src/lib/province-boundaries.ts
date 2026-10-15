import { z } from 'zod'

const provinceAliases: Record<string, string> = {
  'DI ACEH': 'ACEH',
  'D I ACEH': 'ACEH',
  'NANGGROE ACEH DARUSSALAM': 'ACEH',
  'BANGKA BELITUNG': 'KEPULAUAN BANGKA BELITUNG',
  'DI YOGYAKARTA': 'DAERAH ISTIMEWA YOGYAKARTA',
  'D I YOGYAKARTA': 'DAERAH ISTIMEWA YOGYAKARTA',
  YOGYAKARTA: 'DAERAH ISTIMEWA YOGYAKARTA',
  JAKARTA: 'DKI JAKARTA',
  'D K I JAKARTA': 'DKI JAKARTA',
  'DAERAH KHUSUS JAKARTA': 'DKI JAKARTA',
  'DAERAH KHUSUS IBUKOTA JAKARTA': 'DKI JAKARTA',
  'DAERAH KHUSUS IBU KOTA JAKARTA': 'DKI JAKARTA',
}

export function normalizeProvinceName(name: string): string {
  const normalized = name
    .trim()
    .toUpperCase()
    .replace(/^PROVINSI\s+/, '')
    .replace(/[.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return provinceAliases[normalized] ?? normalized
}

export const provinceBoundaryManifestSchema = z
  .object({
    version: z.literal(1),
    geometry: z.string().regex(/^\/data\/indonesia-provinces\.geojson\?v=[a-f0-9]{16}$/),
    geometry_sha256: z.string().regex(/^[a-f0-9]{64}$/),
    provinces: z
      .array(
        z.object({
          id: z.string().regex(/^[1-9][0-9]*$/),
          name: z.string().trim().min(1),
        }),
      )
      .length(38),
  })
  .refine((value) => value.geometry.endsWith(value.geometry_sha256.slice(0, 16)), {
    message: 'Boundary revision does not match its geometry hash.',
  })
  .refine(
    (value) =>
      new Set(value.provinces.map((province) => province.id)).size ===
        value.provinces.length &&
      new Set(value.provinces.map((province) => normalizeProvinceName(province.name)))
        .size === value.provinces.length,
    { message: 'Boundary identifiers and province names must be unique.' },
  )

export type ProvinceBoundaryManifest = z.infer<typeof provinceBoundaryManifestSchema>

const boundaryPositionSchema = z.tuple([
  z.number().min(90).max(145),
  z.number().min(-15).max(10),
])
const boundaryRingSchema = z
  .array(boundaryPositionSchema)
  .min(4)
  .refine((ring) => {
    const first = ring[0]
    const last = ring.at(-1)
    return first[0] === last?.[0] && first[1] === last?.[1]
  }, 'Boundary rings must be closed.')
const boundaryPolygonSchema = z.array(boundaryRingSchema).min(1)
const boundaryGeometrySchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('Polygon'), coordinates: boundaryPolygonSchema }),
  z.object({
    type: z.literal('MultiPolygon'),
    coordinates: z.array(boundaryPolygonSchema).min(1),
  }),
])
const boundaryCollectionSchema = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(
    z.object({
      type: z.literal('Feature'),
      id: z.string(),
      properties: z.object({ province_id: z.string(), province_name: z.string() }),
      geometry: boundaryGeometrySchema,
    }),
  ),
})

export function decodeProvinceBoundaries(
  value: unknown,
  manifest: ProvinceBoundaryManifest,
) {
  const geometry = boundaryCollectionSchema.parse(value)
  const expected = new Map(
    manifest.provinces.map((province) => [
      province.id,
      normalizeProvinceName(province.name),
    ]),
  )
  const seen = new Set<string>()
  for (const feature of geometry.features) {
    if (
      feature.id !== feature.properties.province_id ||
      expected.get(feature.id) !==
        normalizeProvinceName(feature.properties.province_name) ||
      seen.has(feature.id)
    ) {
      throw new Error('Identitas batas provinsi tidak sesuai metadata.')
    }
    seen.add(feature.id)
  }
  if (seen.size !== expected.size)
    throw new Error('Geometri batas provinsi tidak lengkap.')
  return geometry
}
