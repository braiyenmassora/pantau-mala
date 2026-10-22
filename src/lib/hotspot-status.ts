import { getCopy } from '@/copy'
import { formatNumber } from '@/lib/format'
import { RISK_CATEGORIES, riskCategoryLabel } from '@/lib/risk-category'
import {
  effectiveRiskCategory,
  isValidHotspotCount,
  type RiskInput,
} from '@/lib/risk-rule'

/** Ada titik → boleh tampilkan badge/warna risiko. */
export function hasHotspotDetections(count: number | null | undefined): boolean {
  return isValidHotspotCount(count) && count > 0
}

/** Warna pin/dot dari kategori efektif (tanpa_titik = abu; null = belum dinilai). */
export function hotspotDotColor(r: RiskInput): string {
  return RISK_CATEGORIES[effectiveRiskCategory(r)].dot
}

/** Subtitle hover: label risiko, nol titik, atau belum dinilai. */
export function hotspotHoverSubtitle(r: RiskInput): string {
  return riskCategoryLabel(effectiveRiskCategory(r))
}

/** Meta baris popup pin kab/kota. */
export function hotspotPinMeta(
  hotspots_24h: number | null | undefined,
  riskLabel: string,
): string {
  if (!isValidHotspotCount(hotspots_24h)) {
    return riskCategoryLabel('tidak_tersedia')
  }
  if (hotspots_24h === 0) return getCopy().status.noDetections
  return getCopy().map.regionPinDetails(formatNumber(hotspots_24h), riskLabel)
}

/** aria-label pin kab/kota. */
export function hotspotPinAria(
  name: string,
  hotspots_24h: number | null | undefined,
  riskLabel: string,
  countLabel: string,
): string {
  if (!isValidHotspotCount(hotspots_24h)) {
    return `${name}, ${riskCategoryLabel('tidak_tersedia')}`
  }
  if (hotspots_24h === 0) {
    return getCopy().map.pinAriaNoDetections(name)
  }
  return getCopy().map.pinAria(name, riskLabel, countLabel)
}
