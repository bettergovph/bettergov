import type { LatLngBoundsExpression, LatLngExpression } from 'leaflet';

/**
 * Soft pan/zoom limit covering EEZ + Kalayaan Island Group (PD 1596),
 * which together include the West Philippine Sea (AO 29).
 */
export const PH_BOUNDS = {
  south: 2.5,
  north: 23.0,
  west: 111.0,
  east: 131.0,
} as const;

export const PH_CENTER: LatLngExpression = [12.8797, 121.774];

export const PH_DEFAULT_ZOOM = 5;
export const PH_MIN_ZOOM = 4;

/** Leaflet maxBounds: [[south, west], [north, east]] */
export const PH_MAP_BOUNDS: LatLngBoundsExpression = [
  [PH_BOUNDS.south, PH_BOUNDS.west],
  [PH_BOUNDS.north, PH_BOUNDS.east],
];

/** CARTO Voyager — OSM-based */
export const CARTO_VOYAGER_URL =
  'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

export const CARTO_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

/**
 * Key West Philippine Sea reference points (AO 29).
 * Scarborough: ~15°08′N 117°45.5′E; Pag-asa (Thitu): ~11°03′06″N 114°17′07″E.
 */
export const WPS_POIS = [
  {
    id: 'scarborough',
    name: 'Bajo de Masinloc (Scarborough Shoal)',
    position: [15.1347, 117.7583] as LatLngExpression,
  },
  {
    id: 'pagasa',
    name: 'Pag-asa Island (Kalayaan)',
    position: [11.0517, 114.2853] as LatLngExpression,
  },
] as const;

export const WPS_LABEL_POSITION: LatLngExpression = [13.2, 117.2];
