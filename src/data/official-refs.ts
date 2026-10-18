/** Tautan portal resmi nasional — bukan sumber data satelit FIRMS. */

export type OfficialRefId = 'bmkg' | 'bnpb' | 'sipongi' | 'emergency112'

export type OfficialRef = {
  id: OfficialRefId
  href: string
  /** https → tab baru; tel → panggilan di tempat. */
  external: boolean
}

export const OFFICIAL_REFS: readonly OfficialRef[] = [
  { id: 'bmkg', href: 'https://www.bmkg.go.id/', external: true },
  { id: 'bnpb', href: 'https://www.bnpb.go.id/', external: true },
  {
    id: 'sipongi',
    href: 'https://sipongi.gakkum.kehutanan.go.id/',
    external: true,
  },
  { id: 'emergency112', href: 'tel:112', external: false },
] as const

/** Kontak Posko Karhutla daerah — diisi setelah nomor terverifikasi. */
export type PoskoContact = {
  id: string
  name: string
  province: string
  phone: string
  note?: string
}

/**
 * shortcut: kosong sampai ada daftar Posko terverifikasi, isi array ini lalu UI otomatis tampil.
 */
export const POSKO_KARHUTLA: readonly PoskoContact[] = []
