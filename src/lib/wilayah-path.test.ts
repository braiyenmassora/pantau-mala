import { describe, expect, it } from 'vitest'

import {
  buildWilayahPath,
  fromPathCode,
  parseWilayahPath,
  pathLooksLikeStaticAsset,
  slugifyWilayah,
  toPathCode,
} from '@/lib/wilayah-path'

describe('wilayah path codes', () => {
  it('strips and restores BPS dots', () => {
    expect(toPathCode('62.11')).toBe('6211')
    expect(fromPathCode('6211')).toBe('62.11')
    expect(toPathCode('62.11.1')).toBeNull()
    expect(pathLooksLikeStaticAsset('/wilayah/kab-x-62.11')).toBe(true)
    expect(pathLooksLikeStaticAsset('/wilayah/kab-x-6211')).toBe(false)
  })
})

describe('slugifyWilayah', () => {
  it('slugifies Indonesian regency names', () => {
    expect(slugifyWilayah('Kab. Pulang Pisau')).toBe('kab-pulang-pisau')
    expect(slugifyWilayah('Kota Yogyakarta')).toBe('kota-yogyakarta')
  })
})

describe('build and parse', () => {
  it('round-trips path and resolves by trailing code', () => {
    const path = buildWilayahPath('Kab. Pulang Pisau', '62.11')
    expect(path).toBe('/wilayah/kab-pulang-pisau-6211')
    expect(parseWilayahPath(path!)).toEqual({
      kind: 'wilayah',
      slug: 'kab-pulang-pisau',
      code: '62.11',
      pathCode: '6211',
    })
  })

  it('still resolves when slug is wrong', () => {
    expect(parseWilayahPath('/wilayah/slug-salah-6211')).toEqual({
      kind: 'wilayah',
      slug: 'slug-salah',
      code: '62.11',
      pathCode: '6211',
    })
  })

  it('marks malformed wilayah paths as invalid', () => {
    expect(parseWilayahPath('/wilayah/tanpa-kode')).toEqual({ kind: 'invalid' })
    expect(parseWilayahPath('/')).toEqual({ kind: 'home' })
  })
})
