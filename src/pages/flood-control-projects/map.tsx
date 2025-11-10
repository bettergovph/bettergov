import { instantMeiliSearch } from '@meilisearch/instant-meilisearch';
import 'instantsearch.css/themes/satellite.css';
import {
  DownloadIcon,
  InfoIcon,
  MapIcon,
  SatelliteIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from 'lucide-react';
import mapboxgl, { LngLatBounds } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Configure, InstantSearch, useHits } from 'react-instantsearch';
import Button from '../../components/ui/Button';
import { exportMeilisearchData } from '../../lib/exportData';
import FloodControlProjectsTab from './tab';

// Import region data
import philippinesRegionsData from '../../data/philippines-regions.json';
import { HAZARD_LEVEL, MAPBOX_TILESET } from './constants';
import { FloodYearEnum } from '@/enum/map.enum';
import { IMapStyle } from '@/types/map.type';

// Define types for our data

// Define types for region data and GeoJSON properties
interface RegionData {
  id: string;
  name: string;
  description?: string;
  population?: string;
  capital?: string;
  area?: string;
  provinces?: string[];
  wikipedia?: string;
  loading?: boolean;
  projectCount?: number;
  totalCost?: number;
}

interface RegionProperties {
  name: string; // Region name from GeoJSON
  capital?: string;
  population?: string;
  provinces?: string[];
  // Add other properties from your GeoJSON if needed
}

interface FloodControlProject {
  GlobalID?: string;
  objectID?: string;
  ProjectDescription?: string;
  InfraYear?: string;
  Region?: string;
  Province?: string;
  Municipality?: string;
  TypeofWork?: string;
  Contractor?: string;
  ContractCost?: string;
  Latitude?: string;
  Longitude?: string;
}

// Custom component to access Meilisearch hits for map
const MapHitsComponent = ({
  onHitsUpdate,
}: {
  onHitsUpdate: (hits: FloodControlProject[]) => void;
}) => {
  const { hits } = useHits<FloodControlProject>();

  useEffect(() => {
    onHitsUpdate(hits);
  }, [hits, onHitsUpdate]);

  return null;
};

// Meilisearch configuration
const MEILISEARCH_HOST =
  import.meta.env.VITE_MEILISEARCH_HOST || 'http://localhost';
const MEILISEARCH_PORT = import.meta.env.VITE_MEILISEARCH_PORT || '7700';
const MEILISEARCH_SEARCH_API_KEY =
  import.meta.env.VITE_MEILISEARCH_SEARCH_API_KEY ||
  'your_public_search_key_here';
const MAPBOX_ACCESS_TOKEN =
  import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || 'your_mapbox_token';

// Create search client with proper type casting
const meiliSearchInstance = instantMeiliSearch(
  `${MEILISEARCH_HOST}:${MEILISEARCH_PORT}`,
  MEILISEARCH_SEARCH_API_KEY,
  {
    primaryKey: 'GlobalID',
    keepZeroFacets: true,
  }
);

// Extract the searchClient from meiliSearchInstance
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const searchClient = meiliSearchInstance.searchClient as any;

const FloodControlProjectsMap: FC = () => {
  // Loading state for export
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // State for geographic search parameters
  const [geoSearch, setGeoSearch] = useState<{
    lat: number;
    lng: number;
    radius: number;
  } | null>(null);

  // Map states
  const [selectedRegion, setSelectedRegion] = useState<RegionData | null>(null);
  const [hoveredRegionName, setHoveredRegionName] = useState<string | null>(
    null
  );
  const [mapData] = useState<
    GeoJSON.FeatureCollection<GeoJSON.Geometry, RegionProperties>
  >(
    philippinesRegionsData as GeoJSON.FeatureCollection<
      GeoJSON.Geometry,
      RegionProperties
    >
  );
  const [mapStyle, setMapStyle] = useState<IMapStyle>({
    style: 'standard',
    showRain: false,
  });
  const [mapProjects, setMapProjects] = useState<FloodControlProject[]>([]);
  const [isMapLoaded, setIsMapLoaded] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(6);

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  // Export data function
  const handleExportData = useCallback(async () => {
    // Set loading state
    setIsExporting(true);

    try {
      await exportMeilisearchData({
        host: MEILISEARCH_HOST,
        port: MEILISEARCH_PORT,
        apiKey: MEILISEARCH_SEARCH_API_KEY,
        indexName: 'bettergov_flood_control',
        filters: 'type = "flood_control"',
        searchTerm: '',
        filename: 'flood-control-projects-map',
      });
      // Show success message
      alert('Data exported successfully!');
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      // Reset loading state
      setIsExporting(false);
    }
  }, []);

  // Build filter string for Meilisearch
  const buildFilterString = useCallback((): string => {
    return 'type = "flood_control"';
  }, []);

  // Build geo search parameters for Meilisearch aroundLatLng
  const buildGeoSearchParams = useCallback(() => {
    if (!geoSearch) return {};

    // Use Meilisearch's aroundLatLng functionality
    return {
      aroundLatLng: `${geoSearch.lat}, ${geoSearch.lng}`,
      aroundRadius: Math.round(geoSearch.radius), // Convert to meters (integer)
    };
  }, [geoSearch]);

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
      radius: Math.max(radius * 0.6, 10000), // minimum 5km radius
    };
  }, []);

  const addFloodYearTileSet = useCallback(
    (floodYear: FloodYearEnum) => {
      if (!map.current || !isMapLoaded) return;

      const generateMap;

      Object.values(FloodYearEnum).forEach(year => {
        const tilesets = MAPBOX_TILESET[year];

        tilesets.forEach((_, idx) => {
          const sourceId = `flood-${year}-source-${idx}`;
          const layerId = `flood-${year}-layer-${idx}`;

          if (map.current?.getLayer(layerId)) {
            map.current.removeLayer(layerId);
          }
          if (map.current?.getSource(sourceId)) {
            map.current.removeSource(sourceId);
          }
        });
      });

      MAPBOX_TILESET[floodYear]?.forEach((element, idx) => {
        const sourceId = `flood-${floodYear}-source-${idx}`;
        const layerId = `flood-${floodYear}-layer-${idx}`;

        if (!map.current?.getSource(sourceId)) {
          // uploaded flood areas tileset
          map.current?.addSource(sourceId, {
            type: 'vector',
            url: `mapbox://${element.tileSetId}`,
          });
        }

        if (!map.current?.getLayer(layerId)) {
          // layer to visualize flooded areas
          map.current?.addLayer({
            id: layerId,
            type: 'fill',
            source: sourceId,
            'source-layer': element.sourceLayer,
            minzoom: 10,
            maxzoom: 18,
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
    [isMapLoaded]
  );

  // Note: Client-side filtering is no longer needed since we use Meilisearch's aroundLatLng
  // Since we're now using Meilisearch's native geo search,
  // filteredProjects is just the mapProjects returned from the search
  const filteredProjects = mapProjects;

  const handleZoomIn = () => map.current?.zoomIn();
  const handleZoomOut = () => map.current?.zoomOut();

  // Update region statistics when filtered projects change
  useEffect(() => {
    if (selectedRegion && !selectedRegion.loading) {
      const projects = filteredProjects;
      const totalProjects = projects.length;
      const totalCost = projects.reduce(
        (sum: number, project: FloodControlProject) => {
          const cost = parseFloat(project.ContractCost || '0');
          return sum + (isNaN(cost) ? 0 : cost);
        },
        0
      );
      const uniqueContractors = new Set(
        projects
          .map((project: FloodControlProject) => project.Contractor)
          .filter(Boolean)
      ).size;

      setSelectedRegion(prev =>
        prev
          ? {
              ...prev,
              loading: false,
              projectCount: totalProjects,
              totalCost: totalCost,
              description: `${uniqueContractors} contractors`,
            }
          : null
      );
    }
  }, [filteredProjects, selectedRegion]);

  useEffect(() => {
    if (map.current) return; // initialize map only once
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

      // Load tilesets from noah
      addFloodYearTileSet(FloodYearEnum.FIVE_YEAR);

      // Add a source and layer for the projects
      map.current.addSource('projects', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      map.current.addLayer({
        id: 'projects-layer',
        type: 'circle',
        source: 'projects',
        paint: {
          'circle-radius': 6,
          'circle-color': '#B91C1C',
          'circle-stroke-width': 1,
          'circle-stroke-color': '#FFFFFF',
        },
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

          const coordinates = (feature.geometry as GeoJSON.Polygon)
            .coordinates[0];
          const bounds = coordinates.reduce(
            (bounds, coord) => bounds.extend(coord as [number, number]),
            new mapboxgl.LngLatBounds(
              coordinates[0] as [number, number],
              coordinates[0] as [number, number]
            )
          );

          const geoParams = calculateGeoSearchParams(bounds);
          setGeoSearch(geoParams);

          const regionDetails: RegionData = {
            id: regionName,
            name: regionName,
            loading: true,
          };
          setSelectedRegion(regionDetails);

          if (map.current && map.current.getZoom() <= 8) {
            map.current.fitBounds(bounds, { padding: 20 });
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

      // Add click handler for the projects layer
      map.current.on('click', 'projects-layer', e => {
        if (e.features && e.features.length > 0) {
          const feature = e.features[0];
          const project = feature.properties as FloodControlProject;
          const coordinates = (feature.geometry as GeoJSON.Point).coordinates;

          const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<div class='min-w-[200px]'>
              <h3 class='font-bold text-gray-900'>
                ${project.ProjectDescription || 'Unnamed Project'}
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
          );

          new mapboxgl.Popup()
            .setLngLat(coordinates as [number, number])
            .setHTML(popup.getHTML())
            .addTo(map.current!);
        }
      });
    });
  }, [mapData, calculateGeoSearchParams, addFloodYearTileSet]);

  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    const geojson: GeoJSON.FeatureCollection<
      GeoJSON.Point,
      FloodControlProject
    > = {
      type: 'FeatureCollection',
      features: filteredProjects
        .map(project => {
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

    const source = map.current.getSource('projects') as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData(geojson);
    }
  }, [filteredProjects, isMapLoaded]);

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
    if (zoomLevel <= 8) {
      setGeoSearch(null);
      setSelectedRegion(null);
    }
  }, [zoomLevel]);

  return (
    <div className='min-h-screen bg-gray-50'>
      <Helmet>
        <title>Flood Control Projects Map | BetterGov.ph</title>
        <meta
          name='description'
          content='Explore flood control projects on an interactive map'
        />
      </Helmet>

      {/* Simplified layout with minimal filters */}
      <div className='container mx-auto px-4 py-8'>
        <div className='flex flex-col gap-6'>
          {/* Page header */}
          <div className='flex justify-between items-center'>
            <h1 className='text-2xl font-bold text-gray-900'>
              Flood Control Projects Map
            </h1>
            <Button
              variant='outline'
              leftIcon={
                isExporting ? null : <DownloadIcon className='w-4 h-4' />
              }
              onClick={handleExportData}
              disabled={isExporting}
              className='cursor-pointer'
            >
              {isExporting ? 'Exporting...' : 'Export Data'}
            </Button>
          </div>

          {/* View Tabs */}
          <FloodControlProjectsTab selectedTab='map' />

          {/* Hidden InstantSearch for data fetching only */}
          <InstantSearch
            indexName='bettergov_flood_control'
            searchClient={searchClient}
            key={`map-search-${
              geoSearch ? `${geoSearch.lat}-${geoSearch.lng}` : 'all'
            }`}
          >
            <Configure
              hitsPerPage={5000}
              filters={buildFilterString()}
              query=''
              {...buildGeoSearchParams()}
              attributesToRetrieve={[
                'ProjectDescription',
                'Municipality',
                'Province',
                'Region',
                'ContractID',
                'TypeofWork',
                'ContractCost',
                'GlobalID',
                'InfraYear',
                'Contractor',
                'Latitude',
                'Longitude',
              ]}
            />
            <MapHitsComponent onHitsUpdate={setMapProjects} />
          </InstantSearch>

          {/* Map View - separate from InstantSearch to prevent flickering */}
          <div className='bg-white rounded-lg shadow-md p-4'>
            <div className='h-[700px] relative'>
              <div ref={mapContainer} className='h-full w-full' />
              {/* Zoom Controls */}
              <div className='absolute top-4 right-4 z-10 flex flex-col gap-2'>
                <Button
                  variant='primary'
                  size='sm'
                  onClick={handleZoomIn}
                  aria-label='Zoom in'
                >
                  <ZoomInIcon className='h-4 w-4' />
                </Button>
                <Button
                  variant='primary'
                  size='sm'
                  onClick={handleZoomOut}
                  aria-label='Zoom out'
                >
                  <ZoomOutIcon className='h-4 w-4' />
                </Button>
                <Button
                  variant='primary'
                  size='sm'
                  aria-label={
                    mapStyle.style === 'satellite'
                      ? 'Standard View'
                      : 'Satellite View'
                  }
                >
                  {mapStyle.style === 'satellite' ? (
                    <MapIcon
                      className='h-4 w-4'
                      onClick={() =>
                        setMapStyle(curr => ({ ...curr, style: 'standard' }))
                      }
                    />
                  ) : (
                    <SatelliteIcon
                      className='h-4 w-4'
                      onClick={() =>
                        setMapStyle(curr => ({ ...curr, style: 'satellite' }))
                      }
                    />
                  )}
                </Button>
              </div>

              {/* Region Details Panel */}
              {/* {selectedRegion && (
                <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-sm z-1000">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-gray-900 text-lg">
                      {selectedRegion.name}
                    </h3>
                    <button
                      onClick={() => setSelectedRegion(null)}
                      className="text-gray-800 hover:text-gray-700 ml-2"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {selectedRegion.loading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 gap-2">
                        <div className="bg-blue-50 p-3 rounded-md">
                          <p className="text-xs text-gray-800 uppercase tracking-wide">
                            Total Projects
                          </p>
                          <p className="text-xl font-bold text-blue-700">
                            {selectedRegion.projectCount?.toLocaleString() || 0}
                          </p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-md">
                          <p className="text-xs text-gray-800 uppercase tracking-wide">
                            Total Cost
                          </p>
                          <p className="text-xl font-bold text-green-700">
                            ₱
                            {selectedRegion.totalCost?.toLocaleString(
                              undefined,
                              { maximumFractionDigits: 0 }
                            ) || '0'}
                          </p>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-md">
                          <p className="text-xs text-gray-800 uppercase tracking-wide">
                            Contractors
                          </p>
                          <p className="text-xl font-bold text-purple-700">
                            {selectedRegion.description || '0'}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-800">
                          <strong>Projects with location data:</strong>{' '}
                          {
                            filteredProjects.filter(
                              (p: FloodControlProject) =>
                                p.Latitude && p.Longitude
                            ).length
                          }
                        </p>
                        <p className="text-xs text-gray-800 mt-1">
                          Click markers to view project details
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )} */}
            </div>
          </div>

          {/* Data Source Information */}
          <div className='bg-white rounded-lg shadow-md p-4'>
            <div className='flex items-center mb-4'>
              <InfoIcon className='w-5 h-5 text-blue-600 mr-2' />
              <h2 className='text-lg font-semibold text-gray-800'>
                About This Data
              </h2>
            </div>
            <p className='text-gray-800 mb-4'>
              This map displays flood control infrastructure projects across the
              Philippines. Click on a region to filter projects by that area.
              Zoom in to see individual project locations. You can also use the
              filters to narrow down projects by year, type of work, and search
              terms.
            </p>
            <p className='text-sm text-gray-800'>
              Source: Department of Public Works and Highways (DPWH) Flood
              Control Information System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloodControlProjectsMap;
