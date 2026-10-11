/** Semua teks UI berbahasa Indonesia. Sapaan "kamu". */

export const copy = {
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
    indonesiaToday: 'Titik panas di Indonesia',
    provinceToday: (province: string) => `Titik panas di ${province}`,
    subtitle: 'Deteksi satelit dan indikasi risiko per kabupaten/kota',
    hotspot24h: 'Titik panas 24 jam',
    hotspotHint: 'Penjelasan titik panas',
    hotspotTooltip: 'Total titik panas dalam 24 jam',
    topRisk: '5 provinsi dengan titik panas terbanyak',
    topKab: 'Wilayah dengan titik panas terbanyak',
    searchResults: 'Hasil pencarian',
    betaTooltip: 'Bukan peringatan kebakaran.',
    searchPlaceholder: 'Cari kabupaten/kota',
    searchClear: 'Hapus pencarian dan pilihan',
    closeDetail: 'Tutup detail',
  },
  detail: {
    summary: 'Ringkasan',
    actions: 'Yang bisa kamu lakukan',
    conditions: 'Kondisi saat ini',
    humidity: 'Kelembapan',
    wind: 'Angin',
    windUnit: 'km/jam',
    dryDays: 'Hari tanpa hujan',
    dayUnit: 'hari',
    airQuality: 'Kualitas udara',
    airHint: 'Penjelasan kualitas udara',
    airTooltip:
      'Cuaca dan kualitas udara untuk gambaran saja — tidak mengatur warna pin di peta.',
    riskTitle: 'Risiko',
    riskHint: 'Penjelasan risiko',
    riskTooltip: 'Risiko dari jumlah titik panas FIRMS (24 jam). Belum tentu kebakaran.',
    hotspots24hReason: (n: string) => `${n} titik panas`,
    weatherDanger: 'Bahaya cuaca',
    weatherDangerHint: 'Penjelasan bahaya cuaca',
    weatherDangerTooltip:
      'Cuaca dan kualitas udara untuk gambaran saja. Tidak mengatur warna pin di peta.',
    fwiUnit: 'FWI',
    flagDate: 'Deteksi',
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
    baik: 'Baik',
    sedang: 'Sedang',
    tidak_sehat: 'Tidak sehat',
  },
  location: {
    nearbyLabel: 'Titik panas dalam 25 km',
    yourLocation: 'Lokasi kamu',
    radius25: 'Dalam radius 25 km',
    radiusBadge: 'Radius 25 km',
    hotspotUnit: 'titik panas',
    nearbyNoHotspots: 'Tidak ada titik panas dalam radius 25 km.',
    nearest: 'Paling dekat',
    km: 'km',
    riskTitle: 'Titik panas di sekitar kamu',
    riskSubtitle: 'Titik panas satelit dalam radius 25 km',
    useLocation: 'Izinkan lokasi',
    promptTitle: 'Izinkan lokasi untuk melihat titik panas dekat kamu?',
    promptBody: 'Browser meminta izin lokasi. Lokasi kamu tidak disimpan.',
    promptLater: 'Nanti saja',
    promptContinue: 'Lanjutkan',
    /** Label tombol utama — selaras kamus fe-ui-copy. */
    allowLocationFull: 'Izinkan lokasi untuk melihat titik panas dekat kamu',
  },
  map: {
    recenter: 'Pusatkan ke lokasi kamu',
    useMyLocation: 'Gunakan lokasi kamu',
    zoomIn: 'Perbesar',
    zoomOut: 'Perkecil',
    pinAria: (nama: string, risiko: string, n: string) =>
      `${nama}, risiko ${risiko}, ${n} titik panas`,
    regionMetaProvince: (provinsi: string) => `Provinsi ${provinsi}`,
    regionMetaHotspots: (n: string) => `${n} titik panas`,
  },
  filter: {
    allProvinces: 'Semua provinsi',
    pickProvince: 'Pilih provinsi',
    allStatuses: 'Semua',
    allStatusesTitle: (count: string) => `Tampilkan semua kategori (${count} wilayah)`,
    categoryTitle: (count: string, label: string) =>
      `Tampilkan hanya ${count} wilayah risiko ${label}`,
  },

  updatedAt: {
    /** Relatif dari meta.updated_at. */
    stamp: (relatif: string) => `Diperbarui ${relatif}`,
    cadence: 'Diperbarui setiap ~3 jam',
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
    regionSelected: (nama: string) => `Wilayah dipilih: ${nama}`,
    searchHits: (n: number) => `Hasil pencarian: ${n} lokasi`,
  },

  legend: {
    colorTitle: 'Risiko',
    colorHint: 'Kuning sedang, merah sangat tinggi',
    haloTitle: 'Titik panas',
    haloHint: 'Saat zoom: kuning jarang, merah padat.',
  },
  search: {
    provinces: 'Provinsi',
    kabkota: 'Kabupaten/kota',
    provinceTitle: (nama: string) => `Provinsi ${nama}`,
    withHotspots: (n: string) => `${n} wilayah dengan titik panas`,
    noHotspots: 'Tidak ada titik panas aktif',
  },
  footer: {
    sources: [
      {
        name: 'NASA FIRMS',
        href: 'https://firms.modaps.eosdis.nasa.gov',
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
    retry: 'Coba lagi',
    loading: 'Memuat data…',
    indonesia: 'Indonesia',
  },
} as const
