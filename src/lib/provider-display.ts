const feedLabels: Record<string, string> = {
  firms: 'NASA FIRMS · Titik panas',
  bmkg_earthquakes: 'BMKG · Gempa',
  bmkg_forecast: 'BMKG · Prakiraan cuaca desa',
  openmeteo_weather: 'Open-Meteo · Cuaca wilayah',
  openmeteo_air: 'Open-Meteo / CAMS · Kualitas udara',
  openmeteo_soil: 'Open-Meteo · Tanah & elevasi',
  openmeteo_flood: 'Open-Meteo / GloFAS · Debit sungai',
  windy: 'Windy · Angin & atmosfer',
  nasa_eonet: 'NASA EONET · Konteks event',
}

const statusLabels: Record<string, string> = {
  ok: 'Tersedia',
  stale: 'Perlu diperbarui',
  unavailable: 'Belum tersedia',
}

const kindLabels: Record<string, string> = {
  observed: 'Observasi',
  modelled: 'Model',
  derived: 'Turunan',
  contextual: 'Kontekstual',
}

const validationLabels: Record<string, string> = {
  valid: 'Valid',
  no_payload: 'Tanpa arsip payload',
  provider_unavailable: 'Penyedia tidak tersedia',
  rejected: 'Respons ditolak',
}

export function providerDisplayName(feed: string | undefined, provider: string) {
  return (feed && feedLabels[feed]) || provider
}

export function providerStatusLabel(status: string) {
  return statusLabels[status] ?? status
}

export function providerKindLabel(kind: string) {
  return kindLabels[kind] ?? kind
}

export function providerValidationLabel(validation: string) {
  return validationLabels[validation] ?? validation.replaceAll('_', ' ')
}
