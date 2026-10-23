import { describe, expect, it } from 'vitest'

import {
  dischargeSeries,
  latestDischargeM3s,
  latestHistoryScore,
  nearestWindyPoint,
  trendValuesFromHistory,
} from '@/lib/region-history'

describe('trendValuesFromHistory', () => {
  it('falls back when history empty', () => {
    expect(trendValuesFromHistory(undefined, [1, 2, 3])).toEqual([1, 2, 3])
    expect(trendValuesFromHistory([], [1, 2])).toEqual([1, 2])
  })

  it('maps titik_panas in order', () => {
    expect(
      trendValuesFromHistory(
        [
          { tanggal: '2026-10-01', titik_panas: 4, skor: null },
          { tanggal: '2026-10-02', titik_panas: 9, skor: 1 },
        ],
        [0, 0],
      ),
    ).toEqual([4, 9])
  })
})

describe('latestHistoryScore', () => {
  it('returns newest finite skor', () => {
    expect(latestHistoryScore(undefined)).toBeNull()
    expect(
      latestHistoryScore([
        { tanggal: 'a', titik_panas: 1, skor: 40 },
        { tanggal: 'b', titik_panas: 2, skor: null },
        { tanggal: 'c', titik_panas: 3, skor: 84 },
      ]),
    ).toBe(84)
    expect(
      latestHistoryScore([
        { tanggal: 'a', titik_panas: 1, skor: 40 },
        { tanggal: 'b', titik_panas: 2, skor: null },
      ]),
    ).toBe(40)
  })
})

describe('latestDischargeM3s', () => {
  it('skips trailing nulls', () => {
    expect(latestDischargeM3s([1, null, 3.2, null])).toBe(3.2)
    expect(latestDischargeM3s([null, null])).toBeNull()
    expect(latestDischargeM3s(undefined)).toBeNull()
  })
})

describe('dischargeSeries', () => {
  it('maps null to 0', () => {
    expect(dischargeSeries([1, null, 2])).toEqual([1, 0, 2])
    expect(dischargeSeries(undefined)).toEqual([])
  })
})

describe('nearestWindyPoint', () => {
  it('picks closest timestamp', () => {
    const points = [
      {
        ts: 1000,
        suhu_c: 1,
        angin_u: 0,
        angin_v: 0,
        kecepatan_angin_kmj: 1,
        hembusan_kmj: 1,
        kelembapan: 50,
      },
      {
        ts: 5000,
        suhu_c: 2,
        angin_u: 0,
        angin_v: 0,
        kecepatan_angin_kmj: 1,
        hembusan_kmj: 1,
        kelembapan: 50,
      },
      {
        ts: 9000,
        suhu_c: 3,
        angin_u: 0,
        angin_v: 0,
        kecepatan_angin_kmj: 1,
        hembusan_kmj: 1,
        kelembapan: 50,
      },
    ]
    expect(nearestWindyPoint(points, 5200)?.suhu_c).toBe(2)
    expect(nearestWindyPoint(undefined)).toBeUndefined()
  })
})
