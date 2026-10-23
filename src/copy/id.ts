/** Semua teks UI berbahasa Indonesia. Sapaan "kamu". */

export const copy = {
  language: {
    label: 'Bahasa / Language',
    indonesian: 'Bahasa Indonesia',
    english: 'English',
  },
  errors: {
    loadFallback: 'Data belum dapat dimuat.',
    actionFallback: 'Coba lagi sebentar.',
    timeout: 'Koneksi terlalu lama. Coba lagi sebentar.',
    network: 'Tidak terhubung ke server. Coba lagi sebentar.',
    serviceNotReady: 'Layanan belum siap. Coba lagi sebentar.',
    accessDenied: 'Akses tidak diizinkan.',
    sessionRequired: 'Sesi diperlukan.',
    sessionExpired: 'Sesi berakhir. Masuk kembali.',
    rateLimited: 'Batas permintaan tercapai. Coba lagi nanti.',
    catalogTooLarge: 'Katalog wilayah melebihi batas dukungan.',
    photoUploadFailed: 'Upload foto gagal. Coba lagi.',
    workspaceSwitchUnavailable: 'Ganti ruang kerja tidak tersedia di mode ini.',
    tooManyAttempts: 'Terlalu banyak percobaan. Coba lagi setelah satu menit.',
    wrongCredentials: 'Nama pengguna atau kata sandi salah, atau sesi telah berakhir.',
    accessServiceUnavailable: 'Layanan akses belum tersedia. Coba lagi.',
    appAccessUnavailable: 'Akses aplikasi belum tersedia. Coba lagi nanti.',
    accessUnavailable: 'Akses belum tersedia.',
    proxyOriginRequired:
      'FE dan API Go memerlukan proxy origin yang sama dengan base /api/v1.',
    provinceMetaFailed: 'Metadata batas provinsi belum dapat dimuat.',
    provinceGeometryFailed: 'Geometri batas provinsi belum dapat dimuat.',
    provinceHashMismatch: 'Revisi batas provinsi tidak sesuai metadata.',
    provinceIdentityMismatch: 'Identitas batas provinsi tidak sesuai metadata.',
    provinceIncomplete: 'Geometri batas provinsi tidak lengkap.',
    provinceLoadFailed: 'Batas provinsi belum dapat dimuat.',
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
    noDatasetNote: 'Data satelit belum masuk. Itu belum tentu berarti tidak ada api.',
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
    logoutFail: 'Gagal keluar',
    loginFail: 'Tidak dapat masuk.',
    loginLead: 'Masuk untuk melihat data ruang kerjamu.',
    clientUnavailable: 'Akses aplikasi belum tersedia.',
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
    workspaceSwitchFail: 'Ruang kerja belum dapat diganti.',
    workspaceListFail: 'Daftar ruang kerja belum tersedia.',
  },
  empty: {
    noHotspots: {
      title: 'Tidak ada titik panas',
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
      description: 'Tautan tidak dikenali. Cari kabupaten/kota di kolom pencarian.',
      action: 'Cari kabupaten/kota',
    },
    noHotspotsInRegion: {
      title: 'Tidak ada titik panas',
      description: (nama: string) =>
        `Tidak ada titik panas satelit di ${nama} dalam 24 jam terakhir.`,
    },
    loadFail: {
      title: 'Data belum bisa dimuat',
      description: 'Periksa koneksi lalu coba lagi.',
      action: 'Coba lagi',
    },
    offline: {
      title: 'Tidak ada koneksi',
      description: 'Sambungkan ke jaringan lalu coba lagi.',
      action: 'Coba lagi',
    },
    dataLate: {
      title: 'Data terlambat diperbarui',
      description: (waktu: string, sumber: string) =>
        `Data terakhir ${waktu}. Sumber ${sumber} sedang terlambat.`,
    },
    dataStale: {
      title: 'Data mungkin sudah usang',
      description: (waktu: string) =>
        `Pembaruan terakhir ${waktu}. Angka di bawah bisa sudah berubah.`,
    },
    metaUnavailable: {
      title: 'Status pembaruan belum diketahui',
      description: 'Waktu pembaruan data belum tersedia.',
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
    appCrash: {
      title: 'Halaman tidak bisa ditampilkan',
      description: 'Terjadi gangguan. Muat ulang untuk mencoba lagi.',
      action: 'Muat ulang',
    },
  },

  panel: {
    indonesiaToday: 'Pantauan Titik Panas',
    provinceToday: (province: string) => `Pantauan Titik Panas · ${province}`,
    subtitle: 'Deteksi satelit NASA FIRMS · 24 jam terakhir',
    /** Tooltip ⓘ di judul beranda: apa yang ditampilkan di halaman ini. */
    titleTip:
      'Menampilkan sebaran titik panas satelit di Indonesia selama 24 jam terakhir.',
    /** Satu baris di bawah judul beranda panel. */
    limitationNote:
      'Titik panas satelit, bukan konfirmasi kebakaran atau peringatan resmi.',
    /** Orbit satelit: hanya saat nol titik terdeteksi. */
    coverageNote:
      'Satelit tidak memantau terus-menerus. Nol titik belum tentu berarti tidak ada api.',
    hotspot24h: 'Titik panas 24 jam',
    hotspotHint: 'Penjelasan titik panas',
    hotspotTooltip: 'Jumlah titik panas satelit NASA FIRMS 24 jam terakhir.',
    dataSourceLine: 'Data diperoleh dari NASA FIRMS',
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
    close: 'Tutup laporan',
    disclaimer:
      'Dengan mengirim ini, kamu bertanggung jawab penuh atas keaslian isi laporan.',
    emergencyHint: 'Jika melihat asap atau api, hubungi 112.',
    empty: 'Belum ada laporan di titik ini.',
    formTitle: 'Kirim laporan',
    sightingLabel: 'Apa yang kamu lihat?',
    sightings: {
      asap: 'Asap',
      api_terlihat: 'Api terlihat',
      tidak_yakin: 'Tidak yakin',
      sudah_padam: 'Sudah padam',
    },
    authorLabel: 'Nama kamu',
    authorPlaceholder: 'Contoh: Sari W.',
    descriptionLabel: 'Deskripsi (wajib)',
    descriptionPlaceholder: 'Ceritakan apa yang kamu lihat…',
    photoLabel: 'Foto (wajib)',
    photoHint: 'JPG, PNG, atau WebP, maks 2 MB.',
    photoMissing: 'Tambah foto dulu.',
    photoTooBig: 'Foto harus JPG, PNG, atau WebP maks 2 MB.',
    photoAlt: (nama: string) => `Foto laporan dari ${nama}`,
    submit: 'Kirim laporan',
    submitting: 'Mengirim…',
    submitFailed: 'Laporan belum terkirim. Coba lagi.',
    submitSuccessTitle: 'Laporan terkirim',
    submitSuccess: 'Terima kasih — laporanmu sekarang tampil di titik ini.',
    rateLimitedTitle: 'Batas permintaan tercapai',
    rateLimited: 'Kirim laporan dibatasi 5× per jam — coba lagi nanti.',
    badge: (n: string) => `${n} laporan`,
    listTitle: 'Laporan terbaru',
    panelTitle: 'Laporan warga',
    totalUnit: 'laporan dari warga di seluruh Indonesia',
    totalContributeHint:
      'Mau ikut berkontribusi? Buka titik panas di peta, lalu kirim laporan.',
    totalOpenHint: 'Lihat rincian per wilayah',
    groupedEmpty: 'Belum ada laporan warga.',
    panelHint: 'Pengalaman warga di dekat titik panas. Bukan verifikasi resmi.',
    panelOpen: 'Tulis laporan',
    panelContributeHint: 'Kamu juga bisa kirim laporan di sini, kalau mau.',
    panelEmpty: 'Belum ada laporan di wilayah ini.',
    panelLatest: 'Terbaru',
    detailTitle: 'Detail laporan',
    detailBack: 'Kembali ke wilayah',
    detailNotFound: 'Laporan tidak ditemukan.',
    detailLocation: 'Lokasi titik',
    detailCoords: (lat: string, lon: string) => `${lat}, ${lon}`,
    detailWhen: 'Waktu laporan',
    detailSighting: 'Yang dilihat',
    detailMapHint: 'Koordinat dibulatkan ~1 m untuk pengelompokan titik.',
    otherRegions: 'Wilayah lain',
  },
  detail: {
    actions: 'Yang bisa kamu lakukan',
    actionFireContact: 'Jika melihat asap atau api, hubungi 112 atau BPBD setempat.',
    actionCheckLater:
      'Cek lagi nanti. Data satelit biasanya diperbarui tiap beberapa jam.',
    conditions: 'Kondisi saat ini',
    humidity: 'Kelembapan',
    wind: 'Angin',
    windUnit: 'km/jam',
    dryDays: 'Hari tanpa hujan',
    dayUnit: 'hari',
    unavailable: 'Belum tersedia',
    airQuality: 'Kualitas udara',
    airHint: 'Penjelasan kualitas udara',
    airTooltip: (source: string) => `Data kualitas udara diperoleh dari ${source}.`,
    airPm25: 'PM2.5',
    airPm25Unit: 'µg/m³',
    airCategoryLabel: 'Kategori',
    airSource: (name: string) => `Data diperoleh dari ${name}`,
    airSourceFallback: 'Open-Meteo',
    airUpdated: (when: string) => `Diperbarui ${when}`,
    airNoUpdate: 'Waktu pembaruan belum tersedia',
    airMissing: 'Kualitas udara belum tersedia.',
    airPending: 'Kualitas udara masih dicek.',
    airStaleNoAdvice: 'Saran disembunyikan karena data bisa sudah usang.',
    airAdvice: {
      baik: 'Udara diperkirakan baik.',
      sedang:
        'Udara diperkirakan sedang. Batasi aktivitas luar yang lama jika mudah terganggu asap.',
      tidak_sehat: 'Udara diperkirakan tidak sehat. Kurangi aktivitas di luar.',
      sangat_tidak_sehat:
        'Udara diperkirakan sangat tidak sehat. Batasi aktivitas di luar.',
      berbahaya:
        'Udara diperkirakan berbahaya. Hindari aktivitas di luar dan ikuti arahan resmi setempat.',
    },
    riskTitle: 'Risiko',
    riskHint: 'Penjelasan risiko',
    riskTooltip: 'Data titik panas diperoleh dari satelit NASA FIRMS.',
    hotspot24hLabel: 'Titik panas 24 jam',
    hotspotUnitLine: 'titik panas · 24 jam',
    hotspots24hReason: (n: string) => `${n} titik panas (24 jam)`,
    trendVsPrevious: 'dibanding kemarin',
    weatherSourceNote: 'Data cuaca dan kualitas udara diperoleh dari Open-Meteo.',
    weatherMissingTip: 'Nilai cuaca belum tersedia untuk wilayah ini.',
    weatherDanger: 'Indeks cuaca kebakaran',
    weatherDangerHint: 'Penjelasan indeks cuaca kebakaran',
    weatherDangerTooltip: 'Indeks cuaca kebakaran diperoleh dari Open-Meteo.',
    fwiUnit: 'FWI',
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
    riskSubtitle: 'Izinkan lokasi untuk melihat titik panas di sekitarmu.',
    riskNearbyTip: 'Data titik panas dalam 25 km diperoleh dari satelit NASA FIRMS.',
    useLocation: 'Izinkan lokasi',
    tryAgain: 'Coba lagi',
    searchManual: 'Cari kabupaten/kota',
    loading: 'Memuat titik panas di sekitarmu…',
    promptTitle: 'Izinkan lokasi untuk melihat titik panas dekat kamu?',
    promptBody: 'Browser meminta izin lokasi. Lokasi kamu tidak disimpan.',
    promptLater: 'Nanti saja',
    promptContinue: 'Lanjutkan',
    allowLocationFull: 'Izinkan lokasi untuk melihat titik panas di sekitarmu',
    deniedBody:
      'Izin lokasi ditolak. Aktifkan di pengaturan browser, atau cari di kolom pencarian.',
    errorBody: 'Lokasi belum bisa didapat. Coba lagi, atau cari di kolom pencarian.',
    timeoutBody:
      'Permintaan lokasi terlalu lama. Coba lagi, atau cari di kolom pencarian.',
    outsideTitle: 'Lokasi di luar Indonesia',
    outsideBody:
      '“Dekat kamu” hanya untuk lokasi di Indonesia. Cari kabupaten/kota di kolom pencarian.',
    outsidePinNote: 'Di luar area pantauan Indonesia',
  },
  map: {
    recenter: 'Pusatkan ke lokasi kamu',
    useMyLocation: 'Gunakan lokasi kamu',
    zoomIn: 'Perbesar',
    zoomOut: 'Perkecil',
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
    cadence: 'Data biasanya diperbarui setiap beberapa jam dari satelit dan cuaca',
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
    /** Sama dengan RISK_CATEGORIES.tanpa_titik.label / status.noDetections. */
    noDetectionsTitle: 'Tidak ada titik panas terdeteksi',
    densityTitle: 'Kerapatan',
    densityLow: 'Sedikit',
    densityMid: 'Sedang',
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
    noHotspots: 'Tidak ada titik panas satelit dalam 24 jam terakhir.',
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
    /** Contoh: Diperbarui 23 menit yang lalu */
    dataUpdated: (relatif: string) => `Diperbarui ${relatif}`,
    openInNewTab: (name: string) => `${name}, buka di tab baru`,
    officialLabel: 'Sumber resmi',
  },
  official: {
    title: 'Sumber resmi',
    differNote:
      'Angka di situs resmi bisa berbeda karena sumber dan waktu pembaruannya tidak sama.',
    openExternal: (name: string) => `${name}, sumber resmi, buka di tab baru`,
    callLabel: (name: string) => `Telepon ${name}`,
    refs: {
      bmkg: {
        name: 'BMKG',
        blurb: 'Prakiraan cuaca dan info kebencanaan cuaca.',
      },
      bnpb: {
        name: 'BNPB',
        blurb: 'Informasi kebencanaan dan penanggulangan bencana nasional.',
      },
      sipongi: {
        name: 'SiPongi+ · Kementerian Kehutanan',
        blurb: 'Pantauan dan informasi karhutla.',
      },
      emergency112: {
        name: 'Darurat 112',
        blurb: 'Hubungi jika melihat asap atau api.',
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
    pick: 'Pilih...',
    search: 'Cari...',
    notFound: 'Tidak ditemukan',
    retry: 'Coba lagi',
    dismissNotification: 'Tutup notifikasi',
    clearSearch: 'Hapus pencarian',
    /** Satu copy boot (sesi, data, peta). Jangan pecah jadi “Memuat data/peta”. */
    loading: 'Memuat…',
    indonesia: 'Indonesia',
    refresh: 'Segarkan',
  },
  meta: {
    homeTitle: 'Pantau Mala - Pantauan Titik Panas',
    homeDescription:
      'Pantau Mala (pantaumala) — peta titik panas satelit per kabupaten/kota di Indonesia. Bukan konfirmasi kebakaran atau peringatan resmi.',
    wilayahTitle: (name: string) => `${name} - Pantau Mala`,
    wilayahDescription: (name: string) =>
      `Pantau Mala — pantauan titik panas satelit di ${name}. Bukan konfirmasi kebakaran atau peringatan resmi.`,
  },
  share: {
    button: 'Bagikan',
    buttonBusy: 'Membagikan…',
    whatsappFallback: 'Membuka WhatsApp…',
    /** Satu teks netral (tanpa status/angka). Tautan dilampirkan pemanggil. */
    text: (name: string) =>
      `${name} · pantauan titik panas satelit pantaumala. Bukan konfirmasi kebakaran atau peringatan resmi.`,
  },
}
