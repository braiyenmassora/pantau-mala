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
    noHotspotsInRegion: {
      title: 'Tidak ada titik panas',
      description: (nama: string) =>
        `Dalam 7 hari terakhir tidak ada titik panas terdeteksi di ${nama}.`,
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
    mapFail: {
      title: 'Peta belum bisa ditampilkan',
      description:
        'Browser tidak mendukung WebGL atau basemap gagal dimuat. Panel informasi tetap bisa dipakai.',
      action: 'Muat ulang',
    },
    mapLoading: 'Memuat peta…',
  },

  data: {
    samplePill: 'Data contoh',
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
    closeDetail: 'Tutup detail',
    techTitle: 'Info teknis satelit',
    techTime: 'Waktu',
    techSatellite: 'Satelit',
    techConfidence: 'Tingkat keyakinan',
    techFrp: 'Intensitas api (FRP)',
  },
  detail: {
    summary: 'Ringkasan',
    actions: 'Yang bisa kamu lakukan',
    conditions: 'Kondisi saat ini',
    hotspotUnit: 'titik',
    humidity: 'Kelembapan',
    wind: 'Angin',
    windUnit: 'km/jam',
    dryDays: 'Tanpa hujan',
    dayUnit: 'hari',
    airPm25: 'Udara (PM2.5)',
    trend7d: 'Tren titik panas 7 hari',
    trendRange: (start: string, end: string) => `${start} → ${end} titik`,
    riskTitle: 'Risiko kebakaran',
    riskHint: 'Penjelasan skor risiko',
    riskTooltip:
      'Skor 0–100 dari gabungan jumlah titik panas, cuaca kering, dan tren 7 hari. Makin tinggi, makin besar kemungkinan api meluas.',
  },
  confidence: {
    rendah: 'Rendah',
    sedang: 'Sedang',
    tinggi: 'Tinggi',
  },
  air: {
    baik: 'Baik',
    sedang: 'Sedang',
    tidak_sehat: 'Tidak sehat',
  },
  location: {
    nearbyLabel: 'Di sekitar kamu',
    yourLocation: 'Lokasi kamu',
    radius25: 'Dalam radius 25 km',
    radiusBadge: 'Radius 25 km',
    hotspotUnit: 'titik panas',
    nearest: 'Paling dekat',
    km: 'km',
    riskTitle: 'Risiko di sekitar kamu',
    riskSubtitle: 'Titik panas dalam radius 25 km',
    useLocation: 'Gunakan lokasi',
    closePrompt: 'Tutup dialog lokasi',
    promptTitle: 'Lihat risiko di sekitar kamu?',
    promptBody:
      'Browser akan meminta izin lokasi untuk menampilkan titik panas dalam radius 25 km. Lokasi kamu tidak disimpan.',
    promptLater: 'Nanti saja',
    promptContinue: 'Lanjutkan',
  },
  map: {
    recenter: 'Pusatkan ke lokasi kamu',
    useMyLocation: 'Gunakan lokasi kamu',
    zoomIn: 'Perbesar',
    zoomOut: 'Perkecil',
    pinAria: (nama: string, skor: number, risiko: string) =>
      `${nama}, skor ${skor}, risiko ${risiko}`,
  },
  filter: {
    allProvinces: 'Semua provinsi',
    pickProvince: 'Pilih provinsi',
    allStatuses: 'Semua',
    allStatusesTitle: (count: string) =>
      `Tampilkan semua kategori (${count} wilayah)`,
    categoryTitle: (count: string, label: string) =>
      `Tampilkan hanya ${count} wilayah berisiko ${label}`,
  },

  updatedAt: {
    stamp: (waktu: string) => `Diperbarui ${waktu}`,
    problems: (list: string) => `Sumber bermasalah: ${list}`,
    allOk: 'Semua sumber data normal',
    sourceStatus: (name: string, status: string) => `${name} (${status})`,
  },
  app: {
    panelAria: 'Panel informasi',
    hidePanel: 'Sembunyikan panel',
    showPanel: 'Tampilkan panel',
    mapAria: 'Peta titik panas Indonesia',
  },
  a11y: {
    regionSelected: (nama: string) => `Wilayah dipilih: ${nama}`,
    searchHits: (n: number) => `Hasil pencarian: ${n} lokasi`,
  },

  area: {
    title: 'Perkiraan area titik panas',
    hint: 'Penjelasan perkiraan area',
    tooltip:
      'Dihitung dari titik panas satelit yang berdekatan. Bukan luas terbakar sebenarnya.',
    hotspotCount: (n: string) => `${n} titik panas`,
    approxArea: (x: string) => `Luas sekitar ${x} km²`,
    lastDetected: (waktu: string) => `Terakhir terdeteksi ${waktu}`,
    section: 'Area titik panas',
    summary: (count: string, km: string) =>
      `${count} area · sekitar ${km} km²`,
  },
  legend: {
    scoreTitle: '82',
    scoreHint: 'Skor risiko, makin tinggi makin rawan',
    haloTitle: 'Lingkaran',
    haloHint: 'Makin besar, makin banyak titik panas',
    areaTitle: 'Area',
    areaHint: 'Perkiraan area titik panas',
  },

  search: {
    provinces: 'Provinsi',
    kabkota: 'Kabupaten/kota',
    provinceTitle: (nama: string) => `Provinsi ${nama}`,
    withHotspots: (n: number) => `${n} wilayah dengan titik panas`,
    noHotspots: 'Tidak ada titik panas',
    kabNoHotspotsMeta: (provinsi: string) =>
      `${provinsi} · Tidak ada titik panas`,
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
    loading: 'Memuat',
    indonesia: 'Indonesia',
  },
} as const
