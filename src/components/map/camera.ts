import L from 'leaflet';

/** How many zoom clicks out from the configured PSGC boundary are allowed. */
export const ZOOM_OUT_LEVELS = 2;

/** World bounds used only while a flight is in progress. */
export const WORLD_BOUNDS: L.LatLngBoundsExpression = [
  [-85, -180],
  [85, 180],
];

export function boundsOf(data: GeoJSON.GeoJsonObject): L.LatLngBounds | null {
  const bounds = L.geoJSON(data).getBounds();
  return bounds.isValid() ? bounds : null;
}

export function fitZoom(map: L.Map, bounds: L.LatLngBounds): number {
  // getBoundsZoom will not return anything below the current minZoom.
  // Write the option directly. setMinZoom() zooms the map when the current
  // view is below the new floor, and that animation fights the home view.
  const previousMin = map.options.minZoom;
  map.options.minZoom = 0;
  const zoom = map.getBoundsZoom(bounds, false, L.point(28, 28));
  map.options.minZoom = previousMin;
  return zoom;
}

/** Lower the zoom floor without the animated setZoom that setMinZoom() performs. */
export function setMinZoomQuiet(map: L.Map, minZoom: number) {
  if (map.options.minZoom === minZoom) return;
  map.options.minZoom = minZoom;
  map.fire('zoomlevelschange');
}

/**
 * Pan limit for the zoomed-out view.
 * Degree padding (bounds.pad) is not the same shape as the screen in Web
 * Mercator, so a padded province box can be smaller than the viewport. Leaflet
 * then shoves the center toward a corner until the next zoom.
 * Build the limit from the viewport at minZoom instead, and keep it larger
 * than that viewport.
 */
export function viewLimits(
  map: L.Map,
  bounds: L.LatLngBounds,
  minZoom: number
): L.LatLngBounds {
  const half = map.getSize().divideBy(2);
  const center = map.project(bounds.getCenter(), minZoom);
  const view = L.latLngBounds(
    map.unproject(center.subtract(half), minZoom),
    map.unproject(center.add(half), minZoom)
  );
  return view.extend(bounds).pad(0.25);
}
