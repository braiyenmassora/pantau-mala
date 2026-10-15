/** Semua teks UI berbahasa Indonesia. Sapaan "kamu". */

export const copy = {
  weather: {
    title: 'Cuaca & angin',
    locationLabel: 'Desa atau kelurahan',
    searchPlaceholder: 'Cari desa atau kelurahan',
    clearSearch: 'Hapus pencarian atau pilihan desa',
    resultsLabel: 'Hasil pencarian desa',
    searchResults: (count: number) => `${count} desa ditemukan`,
    chooseLocation:
      'Pilih desa untuk melihat prakiraan BMKG dan angin Windy di lokasi yang sama.',
    tabsLabel: 'Prakiraan untuk desa terpilih',
    weatherTab: 'Cuaca',
    windTab: 'Angin',
    bmkg: 'BMKG',
    windy: 'Windy',
    refresh: 'Segarkan prakiraan untuk desa terpilih',
    humidity: 'Kelembapan',
    windSpeed: 'Angin',
    gust: 'Hembusan',
    fetched: 'Diambil',
    model: (name: string) => `Model ${name}; bukan pengukuran langsung.`,
    bmkgUnavailable:
      'Prakiraan desa belum tersedia dari BMKG atau sumber sedang tidak dapat dihubungi. Coba lagi.',
    windyUnavailable:
      'Data angin Windy belum dapat dimuat. Prakiraan BMKG tetap tersedia di tab Cuaca.',
    windNeedsLocation:
      'Angin Windy memakai titik desa dari BMKG. Muat kembali prakiraan cuaca untuk memperoleh titiknya.',
  },
  extra: {
    sources: 'Sumber dan data tambahan',
    noDataset: 'Data FIRMS belum siap',
    noDatasetNote:
      'Data sumber belum tersedia atau sudah usang; jangan menafsirkan data kosong sebagai tidak ada kejadian.',
    shakemap: 'Lihat peta guncangan BMKG',
    national: 'Ringkasan seluruh client',
    nationalNote:
      'Seluruh wilayah pada client aktif; tidak mengikuti filter peta. Bukan peringatan resmi.',
    today: 'Titik 24 jam',
    yesterday: '24 jam sebelumnya',
    dailyChange: 'Perubahan harian',
    highRegions: 'Wilayah indikator tinggi',
    freshness: 'Status semua sumber',
    earthquakes: 'Gempa BMKG',
    feed: 'Jenis feed',
    latest: 'Kejadian terbaru',
    felt: 'Gempa dirasakan',
    m5: 'Magnitudo 5+',
    loadEarthquakes: 'Ambil data gempa',
    bmkg: 'Prakiraan cuaca desa BMKG',
    weatherSources: 'Cuaca desa & atmosfer',
    windyShort: 'Angin & atmosfer',
    gust: 'hembusan',
    villageCode: 'Desa atau kelurahan',
    villageHelp:
      'Cari desa atau kelurahan berdasarkan nama, kecamatan, atau kode. Kode resmi akan dipilih otomatis.',
    loadForecast: 'Ambil prakiraan',
    villagePlaceholder: 'Cari desa atau kelurahan',
    villageSelectPlaceholder: 'Pilih desa atau kelurahan',
    villageSearch: 'Ketik nama desa, kecamatan, atau kode',
    villageEmpty: 'Desa tidak ditemukan',
    villageMinChars: 'Ketik minimal 2 karakter',
    villageLoading: 'Mencari...',
    villageSearchUnavailable: 'Pencarian desa belum tersedia. Coba lagi.',
    villageLabel: 'Pilih desa atau kelurahan untuk prakiraan BMKG',
    unavailable: 'Data belum tersedia atau sumber gagal. Coba muat kembali.',
    empty: 'Belum ada data pada respons sumber.',
    noTimestamp: 'Belum ada waktu sumber',
    historyAndRiver: 'Debit sungai model',
    date: 'Tanggal',
    dateUtc: 'Tanggal (UTC)',
    discharge: 'Debit',
    detections: 'Titik panas',
    score: 'Skor',
    provisional: 'kalibrasi belum final',
    computedAt: 'Indikator dihitung',
    weatherAt: 'Cuaca diperbarui',
    airAt: 'Udara diperbarui',
    detection: 'Detail deteksi',
    satellite: 'Satelit',
    confidence: 'Keyakinan',
    frp: 'FRP',
    sourcesUpdates: 'Sumber & pembaruan data',
    trendChart: 'Tren titik panas',
    trendChartNote: 'Jumlah titik panas per hari · 7 hari terakhir',
    trendChartUnavailable: 'Riwayat tren belum tersedia.',
    trendLatest: 'Terbaru',
    trendPeak: 'Puncak',
    trendAverage: 'Rata-rata',

    river: 'Debit sungai model',
    riverNote:
      'Prakiraan model pada grid sekitar pusat wilayah, bukan kejadian atau peringatan banjir. Tanggal dalam UTC.',
    riverAttribution: 'Open-Meteo / GloFAS / Copernicus',
    loadRiver: 'Muat ulang debit sungai',

    windy: 'Prakiraan atmosfer & angin (Windy)',
    windyNote: (model: string) =>
      `Prakiraan model ${model.toUpperCase()} dari Windy API, bukan pengukuran langsung. Menampilkan kecepatan, hembusan, dan arah angin.`,
    loadWindy: 'Ambil prakiraan angin',
  },

  auth: {
    logout: 'Keluar',
    username: 'Nama pengguna',
    password: 'Kata sandi',
    workspace: 'Ruang kerja',
    showPassword: 'Tampilkan kata sandi',
    hidePassword: 'Sembunyikan kata sandi',
    workspaceSearch: 'Cari ruang kerja…',
    workspaceEmpty: 'Ruang kerja tidak ditemukan',
    workspaceSwitchFail: 'Ruang kerja belum dapat diganti.',
    workspaceListFail: 'Daftar ruang kerja belum tersedia.',
  },
  empty: {
    noHotspots: {
      title: 'Belum ada titik panas',
      description: (wilayah: string) => `Tidak ada titik panas satelit di ${wilayah}.`,
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
      action: 'Hapus pencarian',
    },
    noHotspotsInRegion: {
      title: 'Tidak ada titik panas aktif',
      description: (nama: string) => `Tidak ada titik panas satelit (24 jam) di ${nama}.`,
    },
    loadFail: {
      title: 'Gagal memuat data',
      description: 'Coba lagi.',
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
        'Browser kamu tidak mendukung peta interaktif. Panel informasi tetap bisa dipakai.',
      action: 'Muat ulang',
    },
    basemapFail: {
      title: 'Peta dasar belum termuat',
      action: 'Coba lagi',
    },
    mapPartial: {
      title: 'Sebagian peta belum bisa ditampilkan',
    },
    mapLoading: 'Memuat data…',
  },

  panel: {
    indonesiaToday: 'Pantauan titik panas Indonesia',
    provinceToday: (province: string) => `Pantauan titik panas · ${province}`,
    subtitle: 'Data satelit NASA FIRMS, 24 jam terakhir.',
    limitationNote:
      'Titik panas belum tentu kebakaran. Bukan peringatan resmi.',
    hotspot24h: 'Titik panas 24 jam',
    hotspotHint: 'Penjelasan titik panas',
    hotspotTooltip: 'Total titik panas dalam 24 jam',
    topRisk: 'Provinsi dengan titik panas terbanyak',
    topRiskHint: '5 teratas, 24 jam terakhir',
    topRiskColumn: 'Titik panas',
    topKab: 'Kabupaten/kota dengan titik panas',
    searchResults: 'Hasil pencarian',
    betaTooltip: 'Bukan peringatan kebakaran.',
    searchPlaceholder: 'Cari kabupaten/kota',
    searchClear: 'Hapus pencarian dan pilihan',
    closeDetail: 'Tutup detail',
    backHome: 'Kembali ke pantauan',
    tabSummary: 'Ringkasan',
    tabDetail: 'Detail',
    tabSources: 'Sumber',
    seismicTitle: 'Gempa Terkini BMKG',
    atmosphereTitle: 'Kondisi Atmosfer & Udara',
    avgTemp: 'Suhu rata-rata',
    avgHumidity: 'Kelembapan',
    avgWind: 'Angin rata-rata',
    maxPm25: 'PM2.5 tertinggi',
    seismicEmpty: 'Belum ada data gempa terkini',
  },
  detail: {
    summary: 'Ringkasan',
    actions: 'Yang bisa kamu lakukan',
    actionFireContact:
      'Bila melihat kebakaran, hubungi Damkar di 113 atau 112. Nomor bisa berbeda di tiap daerah.',
    conditions: 'Kondisi saat ini',
    humidity: 'Kelembapan',
    wind: 'Angin',
    windUnit: 'km/jam',
    dryDays: 'Hari tanpa hujan',
    dayUnit: 'hari',
    unavailable: 'Belum tersedia',
    airQuality: 'Kualitas udara',
    airHint: 'Penjelasan kualitas udara',
    airTooltip:
      'Estimasi skala ISPU Permen LHK 14/2020 dari model Open-Meteo, bukan stasiun pemantauan resmi KLHK. Tidak mengatur warna pin di peta.',
    riskTitle: 'Risiko',
    riskHint: 'Penjelasan risiko',
    riskTooltip:
      'Makin banyak titik panas satelit NASA FIRMS (24 jam), makin tinggi kategori di peta. Titik panas belum tentu kebakaran.',
    hotspot24hLabel: 'Titik panas 24 jam',
    hotspots24hReason: (n: string) => `${n} titik panas (24 jam)`,
    weatherDanger: 'Kelas FWI',
    weatherDangerHint: 'Penjelasan kelas FWI',
    weatherDangerTooltip:
      'Kelas Fire Weather Index dari model cuaca. Gambaran saja; tidak mengatur warna pin di peta.',
    fwiUnit: 'FWI',
    flagDate: 'Deteksi',
    updatedAt: (when: string) => `Diperbarui ${when}`,
    trendUp: 'Naik',
    trendDown: 'Turun',
    trendFlat: 'Stabil',
    trendAria: (label: string) => `Tren 7 hari: ${label}`,
    confidence: {
      rendah: 'Rendah',
      sedang: 'Sedang',
      tinggi: 'Tinggi',
    },
    calibrationNote: (score: string | null, quality: string | null) => {
      const head =
        score != null
          ? `Skor ${score}/100 (kalibrasi belum final).`
          : 'Kalibrasi belum final.'
      if (quality === 'stale') {
        return `${head} Indikator kedaluwarsa, bukan peringatan resmi.`
      }
      if (quality && quality !== 'ok') {
        return `${head} Indikator belum lengkap, bukan peringatan resmi.`
      }
      return `${head} Bukan peringatan resmi.`
    },
  },
  /** Label tampilan untuk weather_danger.source. */
  bahayaSumberLabel: {
    BMKG: 'BMKG',
    'FWI dihitung': 'dihitung, bukan BMKG',
  },
  bahaya: {
    aman: 'Aman',
    waspada: 'Waspada',
    bahaya: 'Bahaya',
    ekstrem: 'Ekstrem',
  },
  air: {
    pending_validation: 'Belum dikalibrasi',
    insufficient_data: 'Data belum cukup',
    stale: 'Data kedaluwarsa',
    missing: 'Tidak tersedia',
    baik: 'Baik',
    sedang: 'Sedang (udara)',
    tidak_sehat: 'Tidak sehat',
    sangat_tidak_sehat: 'Sangat tidak sehat',
    berbahaya: 'Berbahaya',
  },
  location: {
    nearbyLabel: 'Dekat kamu',
    nearbyHint: 'Radius 25 km dari lokasimu',
    yourLocation: 'Lokasi kamu',
    radius25: 'Dalam radius 25 km',
    radiusBadge: 'Radius 25 km',
    hotspotUnit: 'titik panas',
    hotspotCount: (n: string) => `${n} titik panas`,
    nearbyNoHotspots: 'Tidak ada titik panas dalam radius 25 km.',
    nearestLine: (km: string, place: string) =>
      `Terdekat: ${km} km, di ${place}`,
    nearestLineNoPlace: (km: string) => `Terdekat: ${km} km`,
    nearest: 'Paling dekat',
    km: 'km',
    riskLabel: 'Risiko',
    riskTitle: 'Dekat kamu',
    riskSubtitle: 'Izinkan akses lokasi untuk melihat titik panas di sekitarmu.',
    useLocation: 'Izinkan lokasi',
    loading: 'Memuat titik panas di sekitarmu…',
    promptTitle: 'Izinkan lokasi untuk melihat titik panas dekat kamu?',
    promptBody: 'Browser meminta izin lokasi. Lokasi kamu tidak disimpan.',
    promptLater: 'Nanti saja',
    promptContinue: 'Lanjutkan',
    allowLocationFull: 'Izinkan lokasi untuk melihat titik panas di sekitarmu',
  },
  map: {
    recenter: 'Pusatkan ke lokasi kamu',
    useMyLocation: 'Gunakan lokasi kamu',
    toggleWind: 'Aliran angin atmosfer',
    toggleTemperature: 'Tampilkan suhu udara',
    zoomIn: 'Perbesar',
    zoomOut: 'Perkecil',
    pinAria: (nama: string, risiko: string, n: string) =>
      `${nama}, risiko ${risiko}, ${n} titik panas`,
    provincePinTitle: (nama: string) => `Provinsi ${nama}`,
    provincePinDetails: (n: string, risiko: string) =>
      `${n} titik panas · Risiko ${risiko}`,
    provincePinPeriod: 'Data 24 jam terakhir',
    regionPinPeriod: 'Data 24 jam terakhir',
    regionPinDetails: (n: string, risiko: string) =>
      `${n} titik panas · Risiko ${risiko}`,
    quakeTitle: (m: string) => `Gempa M ${m}`,
    quakeDepth: (km: number) => `${km} km`,
    quakeSource: 'BMKG',
    regionMetaProvince: (provinsi: string) => `Provinsi ${provinsi}`,
    regionMetaHotspots: (n: string) => `${n} titik panas`,
  },
  filter: {
    allProvinces: 'Semua provinsi',
    pickProvince: 'Pilih provinsi',
    allStatuses: 'Semua',
    wilayahUnit: 'wilayah',
    allStatusesTitle: (count: string) =>
      `Tampilkan semua kategori (${count} wilayah)`,
    categoryTitle: (count: string, label: string) =>
      `Tampilkan hanya ${count} wilayah risiko ${label}`,
  },

  updatedAt: {
    /** Relatif dari meta.updated_at. */
    stamp: (relatif: string) => `Diperbarui ${relatif}`,
    cadence: 'Data diganti setiap sekitar 3 jam dari satelit dan cuaca',
    stale: 'Data mungkin sudah usang',
    problems: (list: string) => `Ada sumber bermasalah: ${list}`,
    sourceStatus: (name: string, status: string) => `${name} (${status})`,
  },
  app: {
    panelAria: 'Panel informasi',
    hidePanel: 'Sembunyikan panel',
    showPanel: 'Tampilkan panel',
    mapAria: 'Peta titik panas Indonesia',
  },
  a11y: {
    brand: 'pantaumala',
    regionSelected: (nama: string) => `Wilayah dipilih: ${nama}`,
    searchHits: (n: number) => `Hasil pencarian: ${n} lokasi`,
  },

  legend: {
    /** PDF §5: kiri bawah; warna kategori juga di chip filter. */
    pinTitle: 'Warna pin',
    pinHint: 'Oranye = Sedang · Merah = Sangat tinggi.',
    temperatureTitle: 'Suhu udara',
    temperatureHint: 'Lapisan suhu terpisah dari titik panas satelit.',
  },
  search: {
    searchProvince: 'Cari provinsi',
    noProvinceFound: 'Provinsi tidak ditemukan',
    provinces: 'Provinsi',
    kabkota: 'Kabupaten/kota',
    provinceTitle: (nama: string) => `Provinsi ${nama}`,
    withHotspots: (n: string) => `${n} wilayah dengan titik panas`,
    noHotspots: 'Tidak ada titik panas aktif',
  },
  footer: {
    sourcesLabel: 'Sumber data:',
    sources: [
      {
        name: 'NASA FIRMS',
        href: 'https://firms.modaps.eosdis.nasa.gov/',
      },
      {
        name: 'Open-Meteo',
        href: 'https://open-meteo.com/',
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
    retry: 'Coba lagi',
    loading: 'Memuat data…',
    indonesia: 'Indonesia',
    refresh: 'Segarkan',
  },
} as const
