/**
 * Shared surface classnames — panel cards + map chrome stay on the same tokens.
 * Prefer these over ad-hoc rounded/bg/border mixes.
 */

/** Muted info card inside the side panel (stats, actions, location). */
export const panelCardClass = 'rounded-card bg-surface-muted p-4'

/** Floating map chrome: legend, banners, detection callout. */
export const mapChromeClass =
  'rounded-card border-line bg-surface border px-3 py-2 shadow-sm'

/** Dark tip on pins / compact map labels. */
export const mapTipClass = 'rounded-ctl bg-ink text-surface px-2 py-1 text-xs'
