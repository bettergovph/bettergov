import { FloodYearEnum } from '@/enum/map.enum';
import { IMapStyle } from '@/types/map.type';
import mapboxgl, { LngLatBounds } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FloodControlProject,
  IMapFloodSimulationState,
  RegionData,
  RegionProperties,
} from '../types';
import {
  HAZARD_BASE,
  HAZARD_LEVEL,
  MAPBOX_TILESET,
  MAX_SIMULATION_FLOOD_DEPTH,
} from '../constants';
import { getExtrusionHeight, mapIdGenerator } from '../utils';

const MAPBOX_ACCESS_TOKEN =
  import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || 'your_mapbox_token';

const {
  generateFloodYearLayerId,
  generateFloodYearSourceId,
  generateFloodSimulationLayerId,
  generateFloodSimulationSourceId,
} = mapIdGenerator();

interface IUseMapboxProps {
  mapData: GeoJSON.FeatureCollection<GeoJSON.Geometry, RegionProperties>;
  selectedFloodYear: FloodYearEnum;
  setGeoSearch: React.Dispatch<
    React.SetStateAction<{ lat: number; lng: number; radius: number } | null>
  >;
  setSelectedRegion: React.Dispatch<React.SetStateAction<RegionData | null>>;
  setHoveredRegionName: React.Dispatch<React.SetStateAction<string | null>>;
  filteredProjects: FloodControlProject[];
  mapStyle: IMapStyle;
  simulation: IMapFloodSimulationState;
  setSimulation: React.Dispatch<React.SetStateAction<IMapFloodSimulationState>>;
  setMapStyle: React.Dispatch<React.SetStateAction<IMapStyle>>;
  selectedRegion: RegionData | null;
  hoveredRegionName: string | null;
}

const MIN_ZOOM_FOR_FLOOD_PROJECTS = 7;

export const useMapbox = ({
  mapData,
  selectedFloodYear,
  setGeoSearch,
  setSelectedRegion,
  setHoveredRegionName,
  filteredProjects,
  mapStyle,
  simulation,
  setSimulation,
  setMapStyle,
  selectedRegion,
  hoveredRegionName,
}: IUseMapboxProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(6);

  // Calculate region center and radius from bounds
  const calculateGeoSearchParams = useCallback((bounds: LngLatBounds) => {
    const center = bounds.getCenter();
    const northEast = bounds.getNorthEast();
    const southWest = bounds.getSouthWest();

    // Calculate approximate radius in meters
    // Use the larger of width or height to ensure coverage
    const latDistance = Math.abs(northEast.lat - southWest.lat) * 111000; // ~111km per degree
    const lngDistance =
      Math.abs(northEast.lng - southWest.lng) *
      111000 *
      Math.cos((center.lat * Math.PI) / 180);
    const radius = Math.max(latDistance, lngDistance) / 2;

    return {
      lat: center.lat,
      lng: center.lng,
      radius: Math.max(radius * 0.6, 10000), // minimum 10km radius
    };
  }, []);

  const removeFloodYearTileSet = useCallback(() => {
    if (!map.current || !isMapLoaded) return;

    Object.values(FloodYearEnum).forEach(year => {
      const tilesets = MAPBOX_TILESET[year];

      tilesets.forEach(({ sourceLayer }) => {
        const sourceId = generateFloodYearSourceId(year, sourceLayer);
        const layerId = generateFloodYearLayerId(year, sourceLayer);

        if (map.current?.getLayer(layerId)) {
          map.current.removeLayer(layerId);
        }
        if (map.current?.getSource(sourceId)) {
          map.current.removeSource(sourceId);
        }
      });
    });
  }, [isMapLoaded]);

  const addFloodYearTileSet = useCallback(
    (floodYear: FloodYearEnum) => {
      if (!map.current || !isMapLoaded) return;

      removeFloodYearTileSet();

      MAPBOX_TILESET[floodYear]?.forEach(element => {
        const sourceId = generateFloodYearSourceId(
          floodYear,
          element.sourceLayer
        );
        const layerId = generateFloodYearLayerId(
          floodYear,
          element.sourceLayer
        );

        if (!map.current?.getSource(sourceId)) {
          map.current?.addSource(sourceId, {
            type: 'vector',
            url: `mapbox://${element.tileSetId}`,
          });
        }

        if (!map.current?.getLayer(layerId)) {
          map.current?.addLayer({
            id: layerId,
            type: 'fill',
            source: sourceId,
            'source-layer': element.sourceLayer,
            minzoom: 10,
            paint: {
              'fill-opacity': 0.8,
              'fill-color': [
                'match',
                ['get', 'Var'],
                1,
                HAZARD_LEVEL[1].color,
                2,
                HAZARD_LEVEL[2].color,
                3,
                HAZARD_LEVEL[3].color,
                'rgba(255,255,255,0)',
              ],
            },
          });
        }
      });
    },
    [isMapLoaded, removeFloodYearTileSet]
  );

  const toggleFloodSimulation = useCallback(
    (simulate: boolean, reset?: boolean) => {
      if (!simulation.floodDepth) {
        map.current?.easeTo({
          pitch: 75,
          duration: 3000,
          zoom: 17.5,
        });

        removeFloodYearTileSet();
      }
      setSimulation((curr: IMapFloodSimulationState) => ({
        ...curr,
        simulating: simulate,
        floodDepth: reset ? 0.1 : curr.floodDepth,
      }));
      setMapStyle((curr: IMapStyle) => ({
        ...curr,
        showRain: simulate,
      }));
    },
    [simulation.floodDepth, removeFloodYearTileSet, setSimulation, setMapStyle]
  );

  const handleZoomIn = () => map.current?.zoomIn();
  const handleZoomOut = () => map.current?.zoomOut();
  const handleSwitchMapStyle = () =>
    setMapStyle((curr: IMapStyle) => ({
      ...curr,
      style: curr.style === 'satellite' ? 'standard' : 'satellite',
    }));

  const handleStopSimulation = useCallback(() => {
    MAPBOX_TILESET[selectedFloodYear].forEach(data => {
      const layerId = generateFloodSimulationLayerId(
        selectedFloodYear,
        data.sourceLayer
      );

      const sourceId = generateFloodSimulationSourceId(
        selectedFloodYear,
        data.sourceLayer
      );

      if (map.current?.getLayer(layerId)) {
        map.current?.removeLayer(layerId);
      }
      if (map.current?.getSource(sourceId)) {
        map.current?.removeSource(sourceId);
      }
    });

    addFloodYearTileSet(selectedFloodYear);

    setSimulation((curr: IMapFloodSimulationState) => ({
      ...curr,
      simulating: false,
      floodDepth: 0,
    }));
    setMapStyle((curr: IMapStyle) => ({
      ...curr,
      showRain: false,
    }));
  }, [selectedFloodYear, addFloodYearTileSet, setSimulation, setMapStyle]);

  useEffect(() => {
    if (map.current) return;
    if (!mapContainer.current) return;

    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/standard?optimize=true',
      center: [121.774, 12.8797],
      zoom: 5,
      antialias: true,
    });

    map.current.on('load', () => {
      if (!map.current) return;
      map.current.addSource('regions', {
        type: 'geojson',
        data: mapData,
      });

      map.current.addLayer({
        id: 'region-fill',
        type: 'fill',
        source: 'regions',
        maxzoom: 15,
        paint: {
          'fill-color': '#EDE9FE',
          'fill-opacity': 0.5,
        },
      });

      map.current.addLayer({
        id: 'region-line',
        type: 'line',
        source: 'regions',
        paint: {
          'line-color': '#A78BFA',
          'line-width': 1,
        },
      });

      map.current.addSource('satellite', {
        type: 'raster',
        url: 'mapbox://mapbox.satellite',
        tileSize: 256,
      });

      map.current.addLayer({
        id: 'satellite-layer',
        type: 'raster',
        source: 'satellite',
        layout: { visibility: 'none' },
      });

      map.current.addSource('terrain', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 256,
        maxzoom: 15,
      });
      map.current.setTerrain({ source: 'terrain', exaggeration: 1 });

      addFloodYearTileSet(FloodYearEnum.FIVE_YEAR);

      map.current.addSource('projects', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      map.current.loadImage('/marker-icon-2x.webp', (error, image) => {
        if (error || !image) throw error;
        if (!map.current?.hasImage('custom-pin')) {
          map.current?.addImage('custom-pin', image);
        }

        map.current?.addLayer({
          id: 'projects-layer',
          type: 'symbol',
          source: 'projects',
          layout: {
            'icon-image': 'custom-pin',
            'icon-size': 0.3,
            'icon-allow-overlap': true,
          },
        });
      });

      setIsMapLoaded(true);

      map.current.on('click', 'region-fill', e => {
        if (e.features && e.features.length > 0) {
          const feature = e.features[0] as unknown as GeoJSON.Feature<
            GeoJSON.Geometry,
            RegionProperties
          >;
          if (!feature.properties) return;
          const props = feature.properties;
          const regionName = props.name;

          let coords: number[][] = [];
          if (feature.geometry.type === 'Polygon') {
            coords = feature.geometry.coordinates[0];
          } else if (feature.geometry.type === 'MultiPolygon') {
            coords = feature.geometry.coordinates.flat(2);
          }

          const bounds = new mapboxgl.LngLatBounds();
          coords.forEach(coord => bounds.extend(coord as [number, number]));

          const geoParams = calculateGeoSearchParams(bounds);
          setGeoSearch(geoParams);

          const regionDetails = {
            id: regionName,
            name: regionName,
            loading: true,
          };

          setSelectedRegion(regionDetails);

          if (map.current && map.current.getZoom() <= 12) {
            map.current.fitBounds(bounds, { padding: 50, duration: 2000 });
          }
        }
      });

      map.current.on('mousemove', 'region-fill', e => {
        if (map.current && map.current.getZoom() > 8) {
          setHoveredRegionName(null);
          return;
        }
        if (e.features && e.features.length > 0) {
          const feature = e.features[0] as unknown as GeoJSON.Feature<
            GeoJSON.Geometry,
            RegionProperties
          >;
          setHoveredRegionName(feature.properties?.name || null);
          if (map.current) {
            map.current.getCanvas().style.cursor = 'pointer';
          }
        }
      });

      map.current.on('mouseleave', 'region-fill', () => {
        setHoveredRegionName(null);
        if (map.current) {
          map.current.getCanvas().style.cursor = '';
        }
      });

      map.current.on('zoomend', () => {
        if (map.current) {
          setZoomLevel(map.current.getZoom());
        }
      });

      map.current.on('click', 'projects-layer', e => {
        if (e.features && e.features.length > 0) {
          const feature = e.features[0];
          const project = feature.properties as FloodControlProject;
          const coordinates = (feature.geometry as GeoJSON.Point).coordinates;

          new mapboxgl.Popup({ offset: 25 })
            .setLngLat(coordinates as [number, number])
            .setHTML(
              `<div class='min-w-[200px]'>
              <h3 class='font-bold text-gray-900'>
                <strong>${project.ProjectDescription || 'Unnamed Project'}</strong>
              </h3>
              <p class='text-sm text-gray-800 mt-1'>
                <strong>Region:</strong> ${project.Region || 'N/A'}
              </p>
              <p class='text-sm text-gray-800'>
                <strong>Province:</strong> ${project.Province || 'N/A'}
              </p>
              <p class='text-sm text-gray-800'>
                <strong>Municipality:</strong> ${project.Municipality || 'N/A'}
              </p>
              <p class='text-sm text-gray-800'>
                <strong>Contractor:</strong> ${project.Contractor || 'N/A'}
              </p>
              <p class='text-sm text-gray-800'>
                <strong>Cost:</strong> ₱${
                  project.ContractCost
                    ? Number(project.ContractCost).toLocaleString()
                    : 'N/A'
                }
              </p>
              <p class='text-sm text-gray-800'>
                <strong>Year:</strong> ${project.InfraYear || 'N/A'}
              </p>
            </div>`
            )
            .addTo(map.current!);
        }
      });
    });
  }, [
    mapData,
    calculateGeoSearchParams,
    addFloodYearTileSet,
    setGeoSearch,
    setSelectedRegion,
    setHoveredRegionName,
  ]);

  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    const source = map.current.getSource('projects') as mapboxgl.GeoJSONSource;

    if (zoomLevel <= MIN_ZOOM_FOR_FLOOD_PROJECTS || !selectedRegion) {
      source.setData('');
      return;
    }
    const geojson: GeoJSON.FeatureCollection<
      GeoJSON.Point,
      FloodControlProject
    > = {
      type: 'FeatureCollection',
      features: filteredProjects
        .map((project: FloodControlProject) => {
          if (!project.Latitude || !project.Longitude) return null;
          const lat = parseFloat(project.Latitude);
          const lng = parseFloat(project.Longitude);
          if (isNaN(lat) || isNaN(lng)) return null;

          return {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [lng, lat],
            },
            properties: project,
          };
        })
        .filter(
          (
            feature
          ): feature is GeoJSON.Feature<GeoJSON.Point, FloodControlProject> =>
            feature !== null
        ),
    };

    if (source) {
      source.setData(geojson);
    }
  }, [filteredProjects, isMapLoaded, zoomLevel, selectedRegion]);

  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    map.current.setLayoutProperty(
      'satellite-layer',
      'visibility',
      mapStyle.style === 'satellite' ? 'visible' : 'none'
    );

    if (mapStyle.showRain) {
      map.current?.setRain({
        density: ['interpolate', ['linear'], ['zoom'], 11, 0.0, 13, 0.5],
        intensity: 0.5,
        color: '#a8adbc',
        opacity: 0.5,
        vignette: ['interpolate', ['linear'], ['zoom'], 11, 0.0, 13, 1.0],
        'vignette-color': '#464646',
        direction: [0, 80],
        'droplet-size': [1.2, 10.2],
        'distortion-strength': 0.2,
        'center-thinning': 0,
      });
    } else {
      map.current?.setRain(null);
    }
  }, [mapStyle, isMapLoaded]);

  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    map.current.setPaintProperty('region-fill', 'fill-color', [
      'case',
      ['==', ['get', 'name'], selectedRegion?.id || ''],
      '#6D28D9',
      ['==', ['get', 'name'], hoveredRegionName || ''],
      '#A78BFA',
      '#EDE9FE',
    ]);

    map.current.setPaintProperty('region-line', 'line-color', [
      'case',
      ['==', ['get', 'name'], selectedRegion?.id || ''],
      '#4C1D95',
      ['==', ['get', 'name'], hoveredRegionName || ''],
      '#4C1D95',
      '#A78BFA',
    ]);

    map.current.setPaintProperty('region-line', 'line-width', [
      'case',
      [
        'any',
        ['==', ['get', 'name'], selectedRegion?.id || ''],
        ['==', ['get', 'name'], hoveredRegionName || ''],
      ],
      2,
      1,
    ]);
  }, [selectedRegion, hoveredRegionName, isMapLoaded]);

  useEffect(() => {
    if (!map.current || !isMapLoaded || !simulation.floodDepth) return;
    let timeout: NodeJS.Timeout;
    if (simulation.simulating) {
      if (simulation.floodDepth >= MAX_SIMULATION_FLOOD_DEPTH) {
        setMapStyle((curr: IMapStyle) => ({ ...curr, showRain: false }));
        return;
      }

      MAPBOX_TILESET[selectedFloodYear].forEach(element => {
        const simulationLayerId = generateFloodSimulationLayerId(
          selectedFloodYear,
          element.sourceLayer
        );

        const simulationSourceId = generateFloodSimulationSourceId(
          selectedFloodYear,
          element.sourceLayer
        );

        if (!map.current?.getSource(simulationSourceId)) {
          map.current?.addSource(simulationSourceId, {
            type: 'vector',
            url: `mapbox://${element.tileSetId}`,
          });
        }

        if (!map.current?.getLayer(simulationLayerId)) {
          map.current?.addLayer({
            id: simulationLayerId,
            type: 'fill-extrusion',
            source: simulationSourceId,
            'source-layer': element.sourceLayer,
            paint: {
              'fill-extrusion-color':
                mapStyle.style === 'satellite'
                  ? 'rgba(30, 144, 255, 0.35)'
                  : 'rgb(152, 220, 254)',

              'fill-extrusion-opacity': 0.8,
              'fill-extrusion-base': [
                'match',
                ['get', 'Var'],
                1,
                HAZARD_BASE[1],
                2,
                HAZARD_BASE[2],
                3,
                HAZARD_BASE[3],
                0,
              ],
              'fill-extrusion-height': 0,
            },
          });
        }
        if (map.current?.getLayer(simulationLayerId)) {
          map.current?.setPaintProperty(
            simulationLayerId,
            'fill-extrusion-height',
            [
              'match',
              ['get', 'Var'],
              1,
              getExtrusionHeight({
                hazardLevel: 1,
                floodYear: selectedFloodYear,
                floodDepth: simulation.floodDepth,
              }),

              2,
              getExtrusionHeight({
                hazardLevel: 2,
                floodYear: selectedFloodYear,
                floodDepth: simulation.floodDepth,
              }),
              3,
              getExtrusionHeight({
                hazardLevel: 3,
                floodYear: selectedFloodYear,
                floodDepth: simulation.floodDepth,
              }),
              0,
            ]
          );
        }
      });

      timeout = setTimeout(() => {
        setSimulation((curr: IMapFloodSimulationState) => ({
          ...curr,
          floodDepth: curr.floodDepth + 0.1,
        }));
      }, 1250);
    }

    return () => clearTimeout(timeout);
  }, [
    simulation,
    isMapLoaded,
    mapStyle.style,
    selectedFloodYear,
    setSimulation,
    setMapStyle,
  ]);

  useEffect(() => {
    if (zoomLevel <= MIN_ZOOM_FOR_FLOOD_PROJECTS) {
      setGeoSearch(null);
      setSelectedRegion(null);
    }
  }, [zoomLevel, setGeoSearch, setSelectedRegion]);

  useEffect(() => {
    addFloodYearTileSet(selectedFloodYear);
  }, [selectedFloodYear, addFloodYearTileSet]);

  return {
    mapContainer,
    map,
    isMapLoaded,
    zoomLevel,
    handleZoomIn,
    handleZoomOut,
    handleSwitchMapStyle,
    toggleFloodSimulation,
    handleStopSimulation,
  };
};
