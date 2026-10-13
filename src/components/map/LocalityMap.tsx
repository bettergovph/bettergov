import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { GeoJSON, MapContainer, TileLayer, useMap } from 'react-leaflet';
import L, { type Layer, type PathOptions } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type {
  GeoJsonFeature,
  GeoJsonFeatureCollection,
} from '../../../functions/api/gis-ph';
import {
  WORLD_BOUNDS,
  ZOOM_OUT_LEVELS,
  boundsOf,
  fitZoom,
  setMinZoomQuiet,
  viewLimits,
} from './camera';

const PHILIPPINES_CENTER: L.LatLngExpression = [12.8797, 121.774];

type Props = {
  features: GeoJsonFeatureCollection;
  /** Deployment boundary. Zoom and pan stay tied to this shape. */
  home: GeoJsonFeatureCollection;
  /** Selected city or municipality on a province map. */
  focus: GeoJsonFeature | null;
  outline: GeoJsonFeature | null;
  selectedCode: string | null;
  onSelect: (code: string) => void;
};

function featureCode(feature: GeoJsonFeature): string {
  const code = feature.properties?.code;
  return typeof code === 'string' ? code : '';
}

function areaStyle(
  feature: GeoJsonFeature | undefined,
  selectedCode: string | null
): PathOptions {
  const selected =
    selectedCode !== null &&
    featureCode(
      feature ?? { type: 'Feature', geometry: null, properties: null }
    ) === selectedCode;
  return {
    color: selected ? '#003d8f' : '#0051ba',
    weight: selected ? 3 : 1,
    fillColor: selected ? '#0051ba' : '#4c8fe0',
    fillOpacity: selected ? 0.55 : 0.28,
  };
}

function stopCamera(map: L.Map) {
  const animating = map as L.Map & { _animatingZoom?: boolean };
  map.stop();
  // stop() does not cancel a zoom tween. The tween's timeout then pulls the
  // map back to the old target, which is what left the province small and offset.
  animating._animatingZoom = false;
}

function showView(
  map: L.Map,
  bounds: L.LatLngBounds,
  limits: L.LatLngBounds,
  flight: { current: number },
  animate: boolean
) {
  const id = ++flight.current;
  const zoom = fitZoom(map, bounds);
  stopCamera(map);
  // A tight maxBounds aborts a zoom-out flight. Open it up, then restore.
  map.setMaxBounds(WORLD_BOUNDS);
  if (!animate) {
    map.setView(bounds.getCenter(), zoom, { animate: false });
    map.setMaxBounds(limits);
    return;
  }
  map.flyTo(bounds.getCenter(), zoom, { duration: 0.7 });
  map.once('moveend', () => {
    if (flight.current !== id) return;
    // flyTo scales the canvas and can leave the polygons off the tiles.
    stopCamera(map);
    map.setView(map.getCenter(), map.getZoom(), { animate: false });
    map.setMaxBounds(limits);
  });
}

function MapCamera({
  home,
  focus,
  selectedCode,
}: {
  home: GeoJsonFeatureCollection;
  focus: GeoJsonFeature | null;
  selectedCode: string | null;
}) {
  const map = useMap();
  const limits = useRef<L.LatLngBounds | null>(null);
  const flight = useRef(0);
  const selectedRef = useRef(selectedCode);
  const seenSelection = useRef(false);
  const [limitsReady, setLimitsReady] = useState(false);
  selectedRef.current = selectedCode;

  useLayoutEffect(() => {
    let appliedFor = '';

    const apply = () => {
      map.invalidateSize({ pan: false });
      const size = map.getSize();
      if (size.x < 10 || size.y < 10) return;
      const key = `${size.x}x${size.y}`;
      if (key === appliedFor) return;

      const homeBounds = boundsOf(home as GeoJSON.GeoJsonObject);
      if (!homeBounds) return;

      const zoom = fitZoom(map, homeBounds);
      const minZoom = Math.max(0, zoom - ZOOM_OUT_LEVELS);
      setMinZoomQuiet(map, minZoom);
      const nextLimits = viewLimits(map, homeBounds, minZoom);
      limits.current = nextLimits;
      map.options.maxBoundsViscosity = 1;
      appliedFor = key;
      // A selected city keeps its own flight. Resizing still refreshes the clamp.
      if (!selectedRef.current) {
        showView(map, homeBounds, nextLimits, flight, false);
      } else {
        map.setMaxBounds(nextLimits);
      }
      setLimitsReady(true);
    };

    apply();
    const frame = requestAnimationFrame(apply);
    const observer = new ResizeObserver(apply);
    observer.observe(map.getContainer());
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [map, home]);

  useEffect(() => {
    const homeBounds = boundsOf(home as GeoJSON.GeoJsonObject);
    const locked = limits.current;
    if (!limitsReady || !homeBounds || !locked) return;

    if (selectedCode && focus?.geometry) {
      seenSelection.current = true;
      const target = boundsOf(focus as GeoJSON.GeoJsonObject);
      if (target) showView(map, target, locked, flight, true);
      return;
    }

    // The home effect owns the first view. This path is only "clear selection".
    if (!seenSelection.current) return;
    seenSelection.current = false;
    const zoom = fitZoom(map, homeBounds);
    setMinZoomQuiet(map, Math.max(0, zoom - ZOOM_OUT_LEVELS));
    showView(map, homeBounds, locked, flight, true);
  }, [map, selectedCode, focus, home, limitsReady]);

  return null;
}

export default function LocalityMap({
  features,
  home,
  focus,
  outline,
  selectedCode,
  onSelect,
}: Props) {
  const areasRef = useRef<L.GeoJSON | null>(null);

  useEffect(() => {
    const group = areasRef.current;
    if (!group) return;
    group.eachLayer(layer => {
      const path = layer as L.Path & { feature?: GeoJsonFeature };
      if (typeof path.setStyle === 'function') {
        path.setStyle(areaStyle(path.feature, selectedCode));
      }
    });
  }, [selectedCode]);

  const onEachBarangay = (feature: GeoJsonFeature, layer: Layer) => {
    const name = feature.properties?.name;
    if (typeof name === 'string' && name) {
      layer.bindTooltip(name, { sticky: true });
    }
    layer.on({
      click: () => {
        const code = featureCode(feature);
        if (code) onSelect(code);
      },
    });
  };

  return (
    <MapContainer
      center={PHILIPPINES_CENTER}
      zoom={6}
      zoomSnap={0}
      zoomAnimation={false}
      scrollWheelZoom
      preferCanvas
      className='z-0 h-full w-full'
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      />
      <MapCamera home={home} focus={focus} selectedCode={selectedCode} />
      {outline && (
        <GeoJSON
          data={outline as GeoJSON.GeoJsonObject}
          style={{ color: '#0f172a', weight: 2, fillOpacity: 0 }}
        />
      )}
      {features.features.length > 0 && (
        <GeoJSON
          ref={areasRef}
          data={features as GeoJSON.GeoJsonObject}
          style={feature =>
            areaStyle(feature as GeoJsonFeature | undefined, selectedCode)
          }
          onEachFeature={(feature, layer) =>
            onEachBarangay(feature as GeoJsonFeature, layer)
          }
        />
      )}
    </MapContainer>
  );
}
