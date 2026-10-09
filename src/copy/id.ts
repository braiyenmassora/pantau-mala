/** Semua teks UI berbahasa Indonesia. */

export const copy = {
  empty: {
    noHotspots: {
      title: 'Belum ada titik panas',
      description: (wilayah: string) =>
        `Tidak ada titik panas terdeteksi dalam 24 jam terakhir di ${wilayah}.`,
    },
    noRegionsFilter: {
      title: 'Tidak ada wilayah',
      description: (kategori: string, wilayah: string) =>
        `Tidak ada wilayah dengan risiko ${kategori} di ${wilayah}.`,
      action: 'Tampilkan semua',
    },
    searchMiss: {
      title: 'Lokasi tidak ditemukan',
      description: 'Coba nama kabupaten/kota lain.',
    },
    nearbyClear: {
      title: 'Tidak ada titik panas di sekitar kamu',
      description: 'Dalam radius 25 km tidak ada titik panas terdeteksi.',
    },
    loadFail: {
      title: 'Data belum bisa dimuat',
      description: 'Periksa koneksi internet, lalu coba lagi.',
      action: 'Coba lagi',
    },
    dataLate: {
      title: 'Data terlambat diperbarui',
      description: (waktu: string, sumber: string) =>
        `Data terakhir ${waktu}. Sumber ${sumber} sedang terlambat.`,
    },
    locationDenied: {
      title: 'Akses lokasi ditolak',
      description:
        'Cari kabupaten/kota lewat kolom pencarian, atau aktifkan lokasi di pengaturan browser.',
    },
    locationError: {
      title: 'Lokasi belum bisa didapat',
      description: 'Coba lagi nanti atau cari kabupaten/kota lewat kolom pencarian.',
      action: 'Coba lagi',
    },
  },
  panel: {
    indonesiaToday: 'Indonesia hari ini',
    provinceToday: (province: string) => `${province} hari ini`,
    subtitle: 'Indikator kebakaran hutan dan lahan',
    hotspot24h: 'Titik panas 24 jam',
    hotspotHint: 'Penjelasan titik panas',
    hotspotTooltip:
      'Titik panas: lokasi yang dideteksi satelit lebih panas dari sekitarnya. Belum tentu kebakaran.',
    last7days: '7 hari terakhir',
    topRisk: 'Wilayah risiko tertinggi',
    searchResults: 'Hasil pencarian',
    betaTooltip: 'Versi uji coba. Skor risiko masih dikalibrasi.',
    newToday: 'Baru muncul hari ini',
    sameAsYesterday: 'Sama dengan kemarin',
    vsYesterday: (pct: string, up: boolean) =>
      `${up ? '▲' : '▼'} ${pct} dibanding kemarin`,
    searchPlaceholder: 'Cari kabupaten/kota',
    searchClear: 'Hapus pencarian dan pilihan',
    techTitle: 'Info teknis satelit',
    techTime: 'Waktu',
    techSatellite: 'Satelit',
    techConfidence: 'Tingkat keyakinan',
    techFrp: 'Intensitas api (FRP)',
  },
  location: {
    nearbyLabel: 'Di sekitar kamu',
    yourLocation: 'Lokasi kamu',
    radius25: 'Dalam radius 25 km',
    hotspotUnit: 'titik panas',
    nearest: 'Paling dekat',
    km: 'km',
    riskTitle: 'Risiko di sekitar kamu',
    riskSubtitle: 'Titik panas dalam radius 25 km',
    useLocation: 'Gunakan lokasi',
    nearbyNoHotspots: 'Tidak ada titik panas dalam radius 25 km',
  },
  legend: {
    score: 'Skor risiko 0–100',
    halo: 'Lingkaran makin besar, titik panas makin banyak',
  },
  footer: {
    sourcePrefix: 'Sumber data:',
    sources: [
      {
        name: 'NASA FIRMS',
        href: 'https://firms.modaps.eosdis.nasa.gov',
      },
      {
        name: 'BMKG',
        href: 'https://www.bmkg.go.id',
      },
      {
        name: 'Open-Meteo',
        href: 'https://open-meteo.com',
      },
    ] as const,
    openInNewTab: (name: string) => `${name}, buka di tab baru`,
  },
  source: {
    firms: 'NASA FIRMS',
    cuaca: 'Cuaca',
    udara: 'Kualitas udara',
  },
  common: {
    beta: 'Beta',
    retry: 'Coba lagi',
  },
} as const
