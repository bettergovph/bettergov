import { afterEach, describe, expect, it } from 'vitest';
import L from 'leaflet';
import {
  ZOOM_OUT_LEVELS,
  fitZoom,
  setMinZoomQuiet,
  viewLimits,
} from '../camera';

const CEBU = L.latLngBounds(
  [9.412867487, 123.296367801],
  [11.524288693, 124.570972329]
);

function sizedMap(width: number, height: number) {
  const container = document.createElement('div');
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;
  Object.defineProperty(container, 'clientWidth', { value: width });
  Object.defineProperty(container, 'clientHeight', { value: height });
  document.body.appendChild(container);
  const map = L.map(container, {
    center: [12.8797, 121.774],
    zoom: 6,
    zoomAnimation: false,
    fadeAnimation: false,
  });
  return map;
}

describe('province camera limits', () => {
  const maps: L.Map[] = [];

  afterEach(() => {
    for (const map of maps) {
      const container = map.getContainer();
      map.remove();
      container.remove();
    }
    maps.length = 0;
  });

  it('keeps the fitted province view inside the pan limit', () => {
    const map = sizedMap(900, 700);
    maps.push(map);

    const zoom = fitZoom(map, CEBU);
    const minZoom = Math.max(0, zoom - ZOOM_OUT_LEVELS);
    const limits = viewLimits(map, CEBU, minZoom);

    map.setMinZoom(minZoom);
    map.options.maxBoundsViscosity = 1;
    map.setMaxBounds(limits);
    map.setView(CEBU.getCenter(), zoom, { animate: false });
    map.setMaxBounds(limits);

    const view = map.getBounds();
    expect(view.getCenter().distanceTo(CEBU.getCenter())).toBeLessThan(1000);
    expect(limits.contains(view)).toBe(true);
    expect(limits.contains(CEBU)).toBe(true);

    map.setZoom(minZoom);
    map.setMaxBounds(limits);
    expect(limits.contains(map.getBounds())).toBe(true);
    expect(map.getCenter().distanceTo(CEBU.getCenter())).toBeLessThan(1000);
  });

  it('does not use a degree pad that is smaller than the zoomed-out screen', () => {
    const map = sizedMap(900, 700);
    maps.push(map);

    const zoom = fitZoom(map, CEBU);
    const minZoom = Math.max(0, zoom - ZOOM_OUT_LEVELS);
    map.setMinZoom(minZoom);
    map.setView(CEBU.getCenter(), minZoom, { animate: false });

    // The old limit. At two zoom levels out the screen is larger than this box,
    // and Leaflet then pans the province off center.
    expect(CEBU.pad(1.5).contains(map.getBounds())).toBe(false);
  });

  it('fits the province to the screen instead of the next whole zoom level down', () => {
    const map = sizedMap(1100, 800);
    maps.push(map);
    map.options.zoomSnap = 0;
    const browser = L.Browser as { any3d: boolean };
    const any3d = browser.any3d;
    browser.any3d = true;

    let zoom = 0;
    let heightFill = 0;
    let widthFill = 0;
    try {
      zoom = fitZoom(map, CEBU);
      map.setView(CEBU.getCenter(), zoom, { animate: false });
      const sw = map.project(CEBU.getSouthWest(), zoom);
      const ne = map.project(CEBU.getNorthEast(), zoom);
      heightFill = Math.abs(ne.y - sw.y) / 800;
      widthFill = Math.abs(ne.x - sw.x) / 1100;
    } finally {
      browser.any3d = any3d;
    }

    expect(Math.max(heightFill, widthFill)).toBeGreaterThan(0.9);
    expect(zoom).toBeGreaterThan(8);
    expect(map.getCenter().distanceTo(CEBU.getCenter())).toBeLessThan(1000);
  });

  it('does not move the view when the zoom floor is raised above the current zoom', () => {
    const map = sizedMap(1100, 800);
    maps.push(map);
    map.setView(CEBU.getCenter(), 6, { animate: false });
    setMinZoomQuiet(map, 8);
    expect(map.getZoom()).toBe(6);
    expect(map.getMinZoom()).toBe(8);
  });
});
