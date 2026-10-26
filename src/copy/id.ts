/** Semua teks UI berbahasa Indonesia. Sapaan "kamu". */

export const copy = {
  language: {
    label: 'Bahasa / Language',
    indonesian: 'Bahasa Indonesia',
    english: 'English',
  },
  errors: {
    loadFallback: 'Data belum termuat.',
    actionFallback: 'Coba lagi.',
    timeout: 'Koneksi terlalu lama. Coba lagi.',
    network: 'Tidak terhubung ke server. Coba lagi.',
    serviceNotReady: 'Layanan belum siap. Coba lagi.',
    accessDenied: 'Kamu tidak punya akses.',
    sessionRequired: 'Masuk dulu untuk lanjut.',
    sessionExpired: 'Sesi berakhir. Masuk lagi.',
    rateLimited: 'Terlalu banyak permintaan. Coba lagi nanti.',
    catalogTooLarge: 'Katalog wilayah ini terlalu besar untuk dimuat.',
    photoUploadFailed: 'Foto gagal diunggah. Coba lagi.',
    workspaceSwitchUnavailable: 'Di mode ini kamu belum bisa ganti ruang kerja.',
    tooManyAttempts: 'Terlalu banyak percobaan. Tunggu satu menit, lalu coba lagi.',
    wrongCredentials: 'Nama pengguna atau kata sandi salah, atau sesimu sudah habis.',
    accessServiceUnavailable: 'Layanan akses belum siap. Coba lagi.',
    appAccessUnavailable: 'Akses aplikasi belum siap. Coba lagi nanti.',
    accessUnavailable: 'Akses belum siap.',
    proxyOriginRequired: 'Alamat data aplikasi belum diatur benar. Hubungi pengelola.',
    provinceMetaFailed: 'Metadata batas provinsi belum termuat.',
    provinceGeometryFailed: 'Geometri batas provinsi belum termuat.',
    provinceHashMismatch: 'Revisi batas provinsi tidak cocok dengan metadata.',
    provinceIdentityMismatch: 'Identitas batas provinsi tidak cocok dengan metadata.',
    provinceIncomplete: 'Geometri batas provinsi tidak lengkap.',
    provinceLoadFailed: 'Batas provinsi belum termuat.',
  },
  riskCategory: {
    tidak_tersedia: 'Belum dinilai',
    tanpa_titik: 'Tidak ada titik panas terdeteksi',
    sangat_tinggi: 'Sangat tinggi',
    sedang: 'Sedang',
    rendah: 'Rendah',
  },
  airPlain: {
    baik: 'Baik',
    sedang: 'Sedang',
    tidak_sehat: 'Tidak sehat',
    sangat_tidak_sehat: 'Sangat tidak sehat',
    berbahaya: 'Berbahaya',
  },
  extra: {
    noDataset: 'Data satelit belum siap',
    noDatasetNote:
      'Data satelit belum masuk. Itu belum tentu berarti tidak ada api di lapangan.',
    detections: 'Titik panas',
    score: 'Skor',
    provisional: 'kalibrasi belum final',
    trendChart: 'Tren 7 hari',
    trendChartUnavailable: 'Riwayat tren belum tersedia.',
    trendLatest: 'Terbaru',
    trendPeak: 'Puncak',
    trendAverage: 'Rata-rata',
    trendPartialToday: (time: string) => `sampai ${time}`,
  },

  auth: {
    logout: 'Keluar',
    logoutFail: 'Gagal keluar.',
    loginFail: 'Gagal masuk.',
    loginLead: 'Masuk untuk lihat data ruang kerjamu.',
    clientUnavailable: 'Akses aplikasi belum siap.',
    retry: 'Coba lagi',
    submitting: 'Memproses…',
    submit: 'Masuk',
    username: 'Nama pengguna',
    password: 'Kata sandi',
    workspace: 'Ruang kerja',
    showPassword: 'Tampilkan kata sandi',
    hidePassword: 'Sembunyikan kata sandi',
    workspaceSearch: 'Cari ruang kerja…',
    workspaceEmpty: 'Ruang kerja tidak ditemukan',
    workspaceSwitchFail: 'Gagal ganti ruang kerja.',
    workspaceListFail: 'Daftar ruang kerja belum siap.',
  },
  empty: {
    noHotspots: {
      title: 'Tidak ada titik panas terdeteksi',
      description: (wilayah: string) =>
        `Tidak ada titik panas satelit di ${wilayah} dalam 24 jam terakhir.`,
    },
    noRegionsFilter: {
      title: 'Tidak ada wilayah',
      description: (kategori: string, wilayah: string) =>
        `Tidak ada kabupaten/kota berkategori ${kategori} di ${wilayah}.`,
      action: 'Tampilkan semua',
    },
    searchMiss: {
      title: 'Lokasi tidak ditemukan',
      description: 'Coba nama kabupaten/kota lain.',
    },
    wilayahNotFound: {
      title: 'Wilayah tidak ditemukan',
      description: 'Tautan ini tidak dikenali. Coba cari kabupaten/kota.',
      action: 'Cari kabupaten/kota',
    },
    noHotspotsInRegion: {
      title: 'Tidak ada titik panas terdeteksi',
      description: (nama: string) =>
        `Tidak ada titik panas satelit di ${nama} dalam 24 jam terakhir.`,
    },
    loadFail: {
      title: 'Data belum termuat',
      description: 'Cek koneksi kamu, lalu coba lagi.',
      action: 'Coba lagi',
    },
    offline: {
      title: 'Tidak ada koneksi',
      description: 'Sambungkan ke jaringan, lalu coba lagi.',
      action: 'Coba lagi',
    },
    dataLate: {
      title: 'Pembaruan data terlambat',
      description: (waktu: string, sumber: string) =>
        `Data terakhir ${waktu}. Sumber ${sumber} lagi terlambat.`,
    },
    dataStale: {
      title: 'Data mungkin sudah usang',
      description: (waktu: string) =>
        `Pembaruan terakhir ${waktu}. Angka di bawah mungkin sudah berubah.`,
    },
    metaUnavailable: {
      title: 'Waktu pembaruan belum diketahui',
      description: 'Belum ada waktu pembaruan data.',
    },
    mapFail: {
      title: 'Peta belum bisa ditampilkan',
      description:
        'Browser kamu belum bisa tampilkan peta interaktif. Panel info tetap bisa dipakai.',
      action: 'Muat ulang',
    },
    basemapFail: {
      title: 'Peta dasar belum termuat',
      action: 'Coba lagi',
    },
    mapPartial: {
      title: 'Sebagian peta belum bisa ditampilkan',
    },
    appCrash: {
      title: 'Halaman tidak bisa ditampilkan',
      description: 'Ada gangguan sementara. Muat ulang halaman.',
      action: 'Muat ulang',
    },
  },

  panel: {
    indonesiaToday: 'Pantauan titik panas',
    provinceToday: (province: string) => `Pantauan titik panas · ${province}`,
    subtitle: 'Deteksi satelit NASA FIRMS · 24 jam terakhir',
    /** Aria singkat untuk ⓘ judul beranda. */
    titleHint: 'Apa yang ditampilkan',
    /** Tooltip ⓘ di judul beranda: apa yang ditampilkan di halaman ini. */
    titleTip: 'Titik panas satelit di Indonesia, 24 jam terakhir.',
    /** Satu baris di bawah judul beranda panel. */
    limitationNote: 'Titik panas satelit, bukan peringatan resmi kebakaran.',
    /** Orbit satelit: hanya saat nol titik terdeteksi. */
    coverageNote:
      'Satelit tidak pantau terus-menerus. Belum ada titik di peta belum tentu berarti tidak ada api.',
    hotspot24h: 'Titik panas 24 jam',
    hotspotHint: 'Apa itu titik panas',
    hotspotTooltip: 'Berapa banyak titik panas NASA FIRMS dalam 24 jam terakhir.',
    dataSourceLine: 'Dari NASA FIRMS',
    topRisk: 'Provinsi terbanyak',
    topRiskHint: '5 teratas, 24 jam terakhir',
    topRiskColumn: 'Titik panas',
    topKab: 'Kabupaten/kota',
    searchResults: 'Hasil pencarian',
    searchPlaceholder: 'Cari kabupaten/kota',
    searchClear: 'Hapus pencarian dan pilihan',
    closeDetail: 'Tutup detail',
    backHome: 'Kembali ke pantauan',
    backIndonesia: 'Kembali ke Indonesia',
  },
  report: {
    title: 'Laporan di titik ini',
    openAria: 'Buka laporan warga di titik panas ini',
    /** Tutup daftar laporan / konteks laporan umum. */
    close: 'Tutup laporan',
    /** Tutup form tulis laporan. */
    formClose: 'Tutup formulir',
    disclaimer: 'Kalau kirim, isinya jadi tanggung jawabmu.',
    emergencyHint: 'Lihat asap atau api? Hubungi 112.',
    empty: 'Belum ada laporan di titik ini.',
    formTitle: 'Tulis laporan',
    sectionTopic: 'Topik',
    sectionSuggestion: 'Usulan',
    sectionReporter: 'Data kamu',
    sightingLabel: 'Apa yang kamu lihat?',
    sightingPick: 'Pilih topik',
    sightings: {
      asap: 'Asap',
      api_terlihat: 'Api terlihat',
      tidak_yakin: 'Tidak yakin',
      sudah_padam: 'Sudah padam',
    },
    authorLabel: 'Nama',
    authorPlaceholder: 'Contoh: Sari W.',
    authorHint: 'Wajib. Nama tampil di laporan.',
    descriptionLabel: 'Cerita',
    descriptionPlaceholder: 'Ceritakan apa yang kamu lihat…',
    photoLabel: 'Foto (sumber)',
    photoHint: 'JPG, PNG, atau WebP, maks 2 MB. Wajib.',
    photoMissing: 'Tambah foto dulu.',
    photoTooBig: 'Pakai JPG, PNG, atau WebP maks 2 MB.',
    photoAlt: (nama: string) => `Foto laporan dari ${nama}`,
    photoPreviewAlt: 'Pratinjau foto laporan',
    photoUnavailable: 'Foto belum tampil',
    submit: 'Kirim laporan',
    submitting: 'Mengirim…',
    submitFailed: 'Belum terkirim. Coba lagi.',
    submitSuccessTitle: 'Laporan terkirim',
    submitSuccess: 'Terima kasih. Laporanmu sudah tampil di titik ini.',
    rateLimitedTitle: 'Terlalu banyak dulu',
    rateLimited: 'Maks 5 laporan per jam. Coba lagi nanti.',
    /** ID: "laporan" sama untuk 1 dan banyak. */
    badge: (n: string) => `${n} laporan`,
    listTitle: 'Laporan terbaru',
    panelTitle: 'Laporan warga',
    /** Tooltip ⓘ di judul kartu — apa arti angka besar. */
    totalInfoTip: 'Total laporan warga dari seluruh Indonesia.',
    /** Ajakan — baris 1 (pola meta Dekat kamu). */
    totalContributeAsk: 'Mau kirim juga?',
    /** Ajakan — baris 2. */
    totalContributeHow: 'Buka titik panas di peta, lalu tulis laporan.',
    totalOpenHint: 'Lihat rincian per wilayah',
    groupedEmpty: 'Belum ada laporan warga.',
    panelHint: 'Dari warga di dekat titik panas. Bukan verifikasi resmi.',
    panelOpen: 'Tulis laporan',
    panelContributeHint: 'Kamu juga bisa kirim laporan di sini.',
    panelEmpty: 'Belum ada laporan di wilayah ini.',
    panelLatest: 'Terbaru',
    detailTitle: 'Detail laporan',
    detailBack: 'Kembali ke wilayah',
    detailNotFound: 'Laporan tidak ditemukan.',
    detailLocation: 'Lokasi titik',
    detailCoords: (lat: string, lon: string) => `${lat}, ${lon}`,
    detailWhen: 'Waktu laporan',
    detailSighting: 'Yang dilihat',
    detailMapHint: 'Koordinat dibulatkan sekitar 1 m supaya titik dekat bisa digabung.',
    otherRegions: 'Wilayah lain',
  },
  detail: {
    actions: 'Yang bisa kamu lakukan',
    actionFireContact: 'Lihat asap atau api? Hubungi 112 atau BPBD setempat.',
    actionCheckLater:
      'Cek lagi nanti. Data satelit biasanya diperbarui tiap beberapa jam.',
    /** Padanan saran API baku (lihat sanitizeAction). */
    actionNoBurn:
      'Jangan membakar lahan atau sampah, dan jangan buang puntung rokok sembarangan.',
    actionReduceSmoke:
      'Kalau ada asap, kurangi aktivitas di luar dan ikuti info kualitas udara resmi.',
    conditions: 'Kondisi saat ini',
    humidity: 'Kelembapan',
    wind: 'Angin',
    windUnit: 'km/jam',
    dryDays: 'Hari tanpa hujan',
    dayUnit: 'hari',
    unavailable: 'Belum ada',
    airQuality: 'Kualitas udara',
    airHint: 'Apa arti kualitas udara',
    airTooltip: (source: string) => `Kualitas udara dari ${source}.`,
    airPm25: 'PM2.5',
    airPm25Unit: 'µg/m³',
    airCategoryLabel: 'Kategori',
    airSource: (name: string) => `Dari ${name}`,
    airSourceFallback: 'Open-Meteo',
    airUpdated: (when: string) => `Diperbarui ${when}`,
    airNoUpdate: 'Waktu pembaruan belum ada',
    airMissing: 'Kualitas udara belum ada.',
    airPending: 'Kualitas udara masih dicek.',
    airStaleNoAdvice: 'Saran disembunyikan karena data mungkin sudah usang.',
    airAdvice: {
      // "diperkirakan" = estimasi model (istilah baku), bukan pengukuran.
      baik: 'Udara diperkirakan baik.',
      sedang:
        'Udara diperkirakan sedang. Batasi aktivitas luar yang lama kalau kamu mudah terganggu asap.',
      tidak_sehat: 'Udara diperkirakan tidak sehat. Kurangi aktivitas di luar.',
      sangat_tidak_sehat:
        'Udara diperkirakan sangat tidak sehat. Batasi aktivitas di luar.',
      berbahaya:
        'Udara diperkirakan berbahaya. Hindari aktivitas di luar dan ikuti arahan resmi setempat.',
    },
    riskTitle: 'Risiko',
    riskHint: 'Apa arti risiko',
    riskTooltip: 'Titik panas dari NASA FIRMS.',
    hotspot24hLabel: 'Titik panas 24 jam',
    hotspotUnitLine: 'titik panas · 24 jam',
    hotspots24hReason: (n: string) => `${n} titik panas (24 jam)`,
    trendVsPrevious: 'dibanding kemarin',
    weatherSourceNote:
      'Cuaca, udara, dan debit sungai dari Open-Meteo. Angin dan hujan titik dari Windy.',
    weatherSourceHint: 'Sumber cuaca dan lingkungan',
    weatherMissingTip: 'Nilai cuaca belum ada untuk wilayah ini.',
    weatherDanger: 'Indeks cuaca kebakaran',
    weatherDangerHint: 'Apa arti indeks cuaca kebakaran',
    weatherDangerTooltip: 'Indeks cuaca kebakaran dari Open-Meteo.',
    fwiUnit: 'FWI',
    riverDischarge: 'Debit sungai',
    riverDischargeUnit: 'm³/detik',
    riverDischargeChart: 'Prakiraan debit 7 hari',
    temp: 'Suhu',
    tempUnit: '°C',
    rain3h: 'Hujan 3 jam',
    rainUnit: 'mm',
    windGust: 'Hembusan',
    scoreToday: (n: string) => `Skor ${n}`,
    lastDetection: 'Deteksi satelit terakhir',
    trendUp: 'Naik',
    trendDown: 'Turun',
    trendFlat: 'Stabil',
  },
  /** Label tampilan untuk weather_danger.source. */
  bahayaSumberLabel: {
    BMKG: 'BMKG',
    'FWI dihitung': 'model, bukan BMKG',
  },
  bahaya: {
    aman: 'Rendah (model)',
    waspada: 'Waspada (model)',
    bahaya: 'Tinggi (model)',
    ekstrem: 'Ekstrem (model)',
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
    yourLocation: 'Lokasi kamu',
    radiusBadge: 'Radius 25 km',
    hotspotUnitLine: 'titik panas dalam 25 km dari lokasimu',
    nearestDistance: (km: string) => `Terdekat ${km} km`,
    riskTitle: 'Dekat kamu',
    riskSubtitle: 'Izinkan lokasi untuk lihat titik panas di sekitarmu.',
    riskNearbyTip: 'Titik panas satelit dalam 25 km dari lokasimu.',
    useLocation: 'Izinkan lokasi',
    tryAgain: 'Coba lagi',
    searchManual: 'Cari kabupaten/kota',
    loading: 'Memuat titik panas di sekitarmu…',
    promptTitle: 'Izinkan lokasi untuk lihat titik panas dekat kamu?',
    promptBody: 'Browser minta izin lokasi. Lokasimu tidak disimpan.',
    promptLater: 'Nanti saja',
    promptContinue: 'Izinkan',
    allowLocationFull: 'Izinkan lokasi untuk lihat titik panas di sekitarmu',
    deniedBody: 'Izin lokasi ditolak. Aktifkan di pengaturan browser, atau cari saja.',
    errorBody: 'Lokasi belum didapat. Coba lagi, atau cari saja.',
    timeoutBody: 'Lokasi terlalu lama. Coba lagi, atau cari saja.',
    outsideTitle: 'Di luar Indonesia',
    outsideBody:
      '"Dekat kamu" hanya untuk lokasi di Indonesia. Cari kabupaten/kota saja.',
    outsidePinNote: 'Di luar area pantauan Indonesia',
  },
  hotspotDetail: {
    title: 'Detail titik panas',
    date: 'Tanggal',
    source: 'Sumber',
    latitude: 'Latitude',
    longitude: 'Longitude',
    confidence: 'Keyakinan',
    regency: 'Kabupaten/kota',
    province: 'Provinsi',
    confidenceValue: {
      rendah: 'Rendah',
      sedang: 'Sedang',
      tinggi: 'Tinggi',
    },
  },
  map: {
    recenter: 'Pusatkan ke lokasi kamu',
    useMyLocation: 'Gunakan lokasi kamu',
    zoomIn: 'Perbesar',
    zoomOut: 'Perkecil',
    findMyLocation: 'Cari lokasi kamu',
    toggleFullscreen: 'Layar penuh',
    resetNorth: 'Hadapkan utara ke atas',
    closePopup: 'Tutup popup',
    openHotspotDetail: 'Lihat detail titik panas',
    pinAria: (nama: string, risiko: string, n: string) =>
      `${nama}, risiko ${risiko}, ${n} titik panas`,
    pinAriaNoDetections: (nama: string) => `${nama}, tidak ada titik panas terdeteksi`,
    regionPinDetails: (n: string, risiko: string) =>
      `${n} titik panas · Risiko ${risiko}`,
    regionMetaProvince: (provinsi: string) => `Provinsi ${provinsi}`,
    regionMetaHotspots: (n: string) => `${n} titik panas`,
    /** Heading cadangan bila nama wilayah tidak ada. */
    hotspotUntitled: 'Titik panas satelit',
    districtName: (nama: string) => `Kecamatan ${nama}`,
    regencyName: (nama: string) => `Kabupaten ${nama}`,
  },
  filter: {
    allProvinces: 'Semua provinsi',
    pickProvince: 'Pilih provinsi',
    allStatuses: 'Semua',
    /** Chip ringkas saat lebar chrome sempit (tablet + panel). */
    riskMenu: 'Risiko',
    riskMenuTitle: (n: string) => `Filter risiko (${n} aktif)`,
    wilayahUnit: 'wilayah',
    allStatusesTitle: (count: string) => `Tampilkan semua kategori (${count} wilayah)`,
    categoryTitle: (count: string, label: string) =>
      `Tampilkan hanya ${count} wilayah risiko ${label}`,
  },

  updatedAt: {
    /** Absolut + zona, mis. formatDateTime(..., 'WIB'). */
    stamp: (when: string) => `Terakhir diperbarui: ${when}`,
    cadence: 'Data biasanya diperbarui tiap beberapa jam dari satelit dan cuaca',
    stale: 'Data mungkin sudah usang',
    staleStamp: (when: string) => `Data mungkin usang · ${when}`,
  },
  app: {
    panelAria: 'Panel informasi',
    hidePanel: 'Sembunyikan panel',
    showPanel: 'Tampilkan panel',
    expandSheet: 'Perbesar panel',
    collapseSheet: 'Perkecil panel',
    sheetHalf: 'Panel setengah layar',
    sheetFull: 'Panel layar penuh',
    mapAria: 'Peta deteksi titik panas Indonesia',
  },
  a11y: {
    brand: 'pantaumala',
    regionSelected: (nama: string) => `Wilayah dipilih: ${nama}`,
    searchHits: (n: number) => `Hasil pencarian: ${n} lokasi`,
  },

  /** Status netral bila nol titik. Bukan tingkat risiko. Sama dengan badge & legenda. */
  status: {
    noDetections: 'Tidak ada titik panas terdeteksi',
  },
  legend: {
    riskTitle: 'Tingkat risiko',
    densityTitle: 'Kerapatan',
    densityLow: 'Sedikit',
    /** Bukan "Sedang" agar tidak bentrok dengan risiko Sedang. */
    densityMid: 'Menengah',
    densityHigh: 'Banyak',
  },
  search: {
    searchProvince: 'Cari provinsi',
    clearProvinceSearch: 'Hapus pencarian provinsi',
    noProvinceFound: 'Provinsi tidak ditemukan',
    provinces: 'Provinsi',
    kabkota: 'Kabupaten/kota',
    provinceTitle: (nama: string) => `Provinsi ${nama}`,
    withHotspots: (n: string) => `${n} wilayah dengan titik panas`,
    noHotspots: 'Tidak ada titik panas terdeteksi dalam 24 jam terakhir.',
  },
  footer: {
    /** Label di atas tautan sumber data yang dipakai panel. */
    dataSourcesLabel: 'Sumber data',
    sources: [
      {
        id: 'firms' as const,
        name: 'NASA FIRMS',
        href: 'https://firms.modaps.eosdis.nasa.gov/',
      },
      {
        id: 'weather' as const,
        name: 'Open-Meteo',
        href: 'https://open-meteo.com/',
      },
      {
        id: 'windy' as const,
        name: 'Windy',
        href: 'https://www.windy.com/',
      },
    ],
    /** Basemap di pojok bawah peta (bukan footer panel). */
    mapAttribution: [
      {
        id: 'carto' as const,
        name: '© CARTO',
        href: 'https://carto.com/attribution/',
      },
      {
        id: 'osm' as const,
        name: '© OpenStreetMap',
        href: 'https://www.openstreetmap.org/copyright',
      },
    ],
    /** Contoh: Diperbarui 23 menit lalu */
    dataUpdated: (relatif: string) => `Diperbarui ${relatif}`,
    openInNewTab: (name: string) => `${name}, buka di tab baru`,
    officialLabel: 'Sumber resmi',
  },
  official: {
    title: 'Sumber resmi',
    differNote:
      'Angka di situs resmi bisa beda. Sumber dan jadwal updatenya memang beda.',
    openExternal: (name: string) => `${name}, sumber resmi, buka di tab baru`,
    callLabel: (name: string) => `Telepon ${name}`,
    refs: {
      bmkg: {
        name: 'BMKG',
        blurb: 'Prakiraan cuaca dan info bencana cuaca.',
      },
      bnpb: {
        name: 'BNPB',
        blurb: 'Info dan respons bencana nasional.',
      },
      sipongi: {
        name: 'SiPongi+ · Kementerian Kehutanan',
        blurb: 'Pantauan karhutla.',
      },
      emergency112: {
        name: 'Darurat 112',
        blurb: 'Hubungi kalau lihat asap atau api.',
      },
    },
    poskoTitle: 'Kontak Posko Karhutla',
    /** Sama pola nama+blurb seperti refs (mis. Darurat 112). */
    poskoEmptyName: 'Belum tersedia',
    poskoEmpty: 'Kontak Posko Karhutla daerah belum ada di sini.',
    poskoPhone: (phone: string) => `Telepon ${phone}`,
  },
  source: {
    firms: 'NASA FIRMS',
    cuaca: 'Cuaca',
    udara: 'Kualitas udara',
  },
  common: {
    pick: 'Pilih…',
    search: 'Cari…',
    notFound: 'Tidak ditemukan',
    retry: 'Coba lagi',
    dismissNotification: 'Tutup notifikasi',
    clearSearch: 'Hapus pencarian',
    moreInfo: 'Info tambahan',
    /** Satu copy boot (sesi, data, peta). Jangan pecah jadi "Memuat data/peta". */
    loading: 'Memuat…',
    indonesia: 'Indonesia',
    refresh: 'Segarkan',
  },
  meta: {
    homeTitle: 'Pantau Mala - Pantauan titik panas',
    homeDescription:
      'Pantau Mala (pantaumala). Titik panas satelit per kabupaten/kota di Indonesia. Bukan peringatan resmi kebakaran.',
    wilayahTitle: (name: string) => `${name} - Pantau Mala`,
    wilayahDescription: (name: string) =>
      `Pantau Mala. Titik panas satelit di ${name}. Bukan peringatan resmi kebakaran.`,
    ogImageAlt: 'Pantau Mala · titik panas satelit Indonesia',
  },
  share: {
    button: 'Bagikan',
    buttonBusy: 'Membagikan…',
    whatsappFallback: 'Membuka WhatsApp…',
    /** Satu teks netral (tanpa status/angka). Tautan dilampirkan pemanggil. */
    text: (name: string) =>
      `${name} · titik panas satelit pantaumala. Bukan peringatan resmi kebakaran.`,
  },
}
