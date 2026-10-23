import type { ExpressionSpecification } from 'maplibre-gl'

import type { Locale } from '@/copy'

/** Label tempat basemap Carto mengikuti locale UI. */
export function basemapPlaceTextField(locale: Locale): ExpressionSpecification {
  return locale === 'en'
    ? ['coalesce', ['get', 'name:en'], ['get', 'name'], ['get', 'name:id']]
    : ['coalesce', ['get', 'name:id'], ['get', 'name'], ['get', 'name:en']]
}

export const BASEMAP_PLACE_TEXT_LAYERS = [
  'place_country_1',
  'place_country_2',
  'place_state',
  'place_city',
  'place_city_r6',
  'place_city_r5',
  'place_town',
  'place_suburbs',
  'place_villages',
  'place_hamlet',
  'roadname_major',
  'roadname_pri',
  'roadname_sec',
  'roadname_minor',
] as const
