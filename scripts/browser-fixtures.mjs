/** Synthetic browser-only Go-contract fixtures. Never shipped through app runtime. */
export async function installGoFixtures(context, signedIn = true) {
  const principal = {
    client_id: '00000000-0000-4000-8000-000000000001',
    client_slug: 'synthetic-fixture',
    username: 'fixture',
    role: 'reader',
  }
  const session = { token: 'pms_synthetic_browser_fixture', principal }
  const region = {
    kode: '99.01',
    nama: 'Fixture Pulang Pisau',
    provinsi: 'Fixture Province',
    zona_waktu: 'WIB',
    pusat: [114, -2],
    skor: 90,
    kategori: 'sangat_tinggi',
    titik_panas_24j: 11,
    tren_7h: [0, 0, 0, 0, 0, 0, 11],
    cuaca: {
      suhu_c: 30,
      kondisi: 'Fixture',
      kelembapan: 60,
      angin_kmj: 5,
      hari_tanpa_hujan: 2,
    },
    udara: { pm25: 20, kategori: 'pending_validation' },
    deteksi_terakhir: {
      waktu: '2026-10-12T00:00:00Z',
      satelit: 'Fixture',
      keyakinan: 'tinggi',
      frp_mw: 2,
    },
    ringkasan: 'Synthetic browser fixture only.',
    saran: ['Synthetic fixture advice.'],
    status_indikator: 'pending_validation',
  }
  await context.route('**/frontend/session', (route) =>
    route.fulfill({ status: 404, json: { error: { code: 'not_found' } } }),
  )
  await context.route('**/auth/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    if (path.startsWith('/src/')) return route.continue()
    if (path === '/auth/browser-session' && route.request().method() === 'POST')
      return route.fulfill({
        status: signedIn ? 200 : 401,
        json: signedIn ? session : { error: { code: 'unauthorized' } },
      })
    if (path === '/auth/login') {
      signedIn = true
      return route.fulfill({ json: session })
    }
    if (path === '/auth/browser-session' && route.request().method() === 'DELETE') {
      signedIn = false
      return route.fulfill({ status: 204 })
    }
    if (path === '/auth/clients')
      return route.fulfill({
        json: {
          data: [
            {
              id: principal.client_id,
              slug: principal.client_slug,
              name: 'Synthetic fixture',
              enabled: true,
            },
          ],
        },
      })
    return route.fulfill({ status: 404, json: { error: { code: 'not_found' } } })
  })
  await context.route('**/api/v1/**', async (route) => {
    if (
      !signedIn ||
      route.request().headers().authorization !== `Bearer ${session.token}`
    )
      return route.fulfill({ status: 401, json: { error: { code: 'unauthorized' } } })
    const path = new URL(route.request().url()).pathname
    if (path === '/api/v1/regions')
      return route.fulfill({
        json: { data: [region], pagination: { limit: 1000, offset: 0 } },
      })
    if (path === '/api/v1/hotspots.geojson')
      return route.fulfill({
        json: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [114.1, -2.1] },
              properties: {
                waktu: '2026-10-19T12:00:00Z',
                satelit: 'VIIRS',
                keyakinan: 'tinggi',
                frp_mw: 4.2,
                kode_wilayah: region.kode,
              },
            },
          ],
        },
      })
    if (path === '/api/v1/summary')
      return route.fulfill({
        json: {
          data: {
            titik_panas_24j: 11,
            titik_panas_kemarin: 7,
            tren_7h: [2, 4, 3, 6, 5, 7, 11],
            wilayah_sangat_tinggi: 1,
            perubahan_harian: 0.571,
            arah_tren: 'naik',
            jumlah_kategori: { sangat_tinggi: 1, sedang: 0, rendah: 0 },
          },
        },
      })
    if (path === '/api/v1/hotspot-reports/counts')
      return route.fulfill({
        json: { data: [{ point_lat: -2.1, point_lon: 114.1, count: 2 }] },
      })
    if (path === '/api/v1/hotspot-reports') return route.fulfill({ json: { data: [] } })
    if (path === '/api/v1/data-status')
      return route.fulfill({
        json: {
          data: {
            diperbarui: null,
            sumber: {
              firms: { status: 'terlambat', diperbarui: null },
              cuaca: { status: 'terlambat', diperbarui: null },
              udara: { status: 'terlambat', diperbarui: null },
            },
          },
        },
      })
    if (path === '/api/v1/region-catalog')
      return route.fulfill({
        json: {
          data: {
            provinces: [
              {
                code: '99',
                name: region.provinsi,
                bbox: [113, -3, 115, -1],
                center: [114, -2],
              },
            ],
            regencies: [
              {
                code: region.kode,
                name: region.nama,
                province: region.provinsi,
                province_code: '99',
                center: region.pusat,
                time_zone: 'WIB',
              },
            ],
          },
        },
      })
    return route.fulfill({ status: 404, json: { error: { code: 'not_found' } } })
  })
  // A minimal test style avoids vendor availability affecting UI/accessibility tests.
  await context.route('https://**/*.json', (route) =>
    route.fulfill({ json: { version: 8, sources: {}, layers: [] } }),
  )
}
