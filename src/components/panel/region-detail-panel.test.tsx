/** @vitest-environment jsdom */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { RegionDetailPanel } from '@/components/panel/region-detail-panel'
import { TooltipProvider } from '@/components/ui/tooltip'
import { copy } from '@/copy/id'
import type { Region } from '@/data/types'
import { formatDateTime, formatNumber } from '@/lib/format'

/** Snapshot of Kab. Pulang Pisau from public/data/wilayah.json (kode 62.11). */
const pulangPisau: Region = {
  kode: '62.11',
  nama: 'Kab. Pulang Pisau',
  provinsi: 'Kalimantan Tengah',
  zona_waktu: 'WIB',
  pusat: [114.25, -2.75],
  skor: 82,
  kategori: 'sangat_tinggi',
  titik_panas_24j: 23,
  tren_7h: [8, 10, 12, 11, 15, 18, 23],
  cuaca: {
    suhu_c: 34,
    kondisi: 'Cerah berawan',
    kelembapan: 48,
    angin_kmj: 12,
    hari_tanpa_hujan: 9,
  },
  udara: { pm25: 62, kategori: 'tidak_sehat' },
  deteksi_terakhir: {
    waktu: '2026-10-09T13:55:00+07:00',
    satelit: 'MODIS Aqua',
    keyakinan: 'tinggi',
    frp_mw: 11.4,
  },
  ringkasan: 'Ringkasan uji',
  saran: ['Saran uji'],
}

function renderDetail(region: Region) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <TooltipProvider>
        <RegionDetailPanel region={region} />
      </TooltipProvider>
    </QueryClientProvider>,
  )
}

describe('RegionDetailPanel', () => {
  it('shows satellite tech open by default (Pulang Pisau)', () => {
    renderDetail(pulangPisau)

    expect(screen.getByText(copy.panel.techTitle)).toBeTruthy()
    expect(screen.getByText(copy.panel.techTime)).toBeTruthy()
    expect(
      screen.getByText(
        formatDateTime(pulangPisau.deteksi_terakhir.waktu, pulangPisau.zona_waktu),
      ),
    ).toBeTruthy()
    expect(screen.getByText(copy.panel.techSatellite)).toBeTruthy()
    expect(screen.getByText('MODIS Aqua')).toBeTruthy()
    expect(screen.getByText(copy.panel.techConfidence)).toBeTruthy()
    expect(screen.getByText('Tinggi')).toBeTruthy()
    expect(screen.getByText(copy.panel.techFrp)).toBeTruthy()
    expect(
      screen.getByText(
        `${formatNumber(pulangPisau.deteksi_terakhir.frp_mw, {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })} MW`,
      ),
    ).toBeTruthy()
    expect(screen.queryByRole('button', { name: copy.panel.techTitle })).toBeNull()
  })

  it('keeps score and /100 on one baseline row', () => {
    const { container } = renderDetail(pulangPisau)
    const scoreRow = container.querySelector('.flex.items-baseline.gap-1')
    expect(scoreRow?.textContent).toContain('82')
    expect(scoreRow?.textContent).toContain('/100')
  })
})
