import { describe, expect, it } from 'vitest'

import type { Region } from '@/data/types'
import { computeSummary } from '@/lib/summary'

function stub(partial: Pick<Region, 'kategori' | 'tren_7h'>): Region {
  return {
    kode: 'x',
    nama: 'x',
    provinsi: 'x',
    zona_waktu: 'WIB',
    pusat: [0, 0],
    skor: 1,
    titik_panas_24j: 1,
    cuaca: {
      suhu_c: 30,
      kondisi: 'Cerah',
      kelembapan: 50,
      angin_kmj: 5,
      hari_tanpa_hujan: 1,
    },
    udara: { pm25: 10, kategori: 'baik' },
    deteksi_terakhir: {
      waktu: '2026-10-09T00:00:00+07:00',
      satelit: 'VIIRS',
      keyakinan: 'tinggi',
      frp_mw: 1,
    },
    ringkasan: '',
    saran: [],
    ...partial,
  }
}

describe('computeSummary', () => {
  it('sums daily trends and counts categories', () => {
    const summary = computeSummary([
      stub({ kategori: 'sangat_tinggi', tren_7h: [1, 2, 3, 4, 5, 10, 20] }),
      stub({ kategori: 'rendah', tren_7h: [1, 1, 1, 1, 1, 5, 3] }),
    ])
    expect(summary.totalsByDay).toEqual([2, 3, 4, 5, 6, 15, 23])
    expect(summary.yesterdayTotal).toBe(15)
    expect(summary.todayTotal).toBe(23)
    expect(summary.changePercent).toBeCloseTo(((23 - 15) / 15) * 100)
    expect(summary.countByCategory).toEqual({
      sangat_tinggi: 1,
      sedang: 0,
      rendah: 1,
    })
  })

  it('returns null change when yesterday is 0 and today > 0', () => {
    const summary = computeSummary([
      stub({ kategori: 'sedang', tren_7h: [0, 0, 0, 0, 0, 0, 4] }),
    ])
    expect(summary.changePercent).toBeNull()
  })
})
