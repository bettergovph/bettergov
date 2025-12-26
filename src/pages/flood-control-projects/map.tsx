import { useState, useEffect, useCallback, useRef, useMemo, FC } from 'react';
import { Helmet } from 'react-helmet-async';
import { InstantSearch, Configure, useHits } from 'react-instantsearch';
import { instantMeiliSearch } from '@meilisearch/instant-meilisearch';
import 'instantsearch.css/themes/satellite.css';
import { exportMeilisearchData } from '../../lib/exportData';
import { DownloadIcon, InfoIcon, ZoomInIcon, ZoomOutIcon } from 'lucide-react';
import Button from '../../components/ui/Button';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L, { LatLngExpression, GeoJSON as LeafletGeoJSON, Layer } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css';
import FloodControlProjectsTab from './tab';
import ProjectMarker from '../../components/map/ProjectMarker';

// Import region data
import philippinesRegionsData from '../../data/philippines-regions.json';

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
  const [mapProjects, setMapProjects] = useState<FloodControlProject[]>([]);
  const [zoomLevel, setZoomLevel] = useState<number>(6);
  const mapRef = useRef<L.Map>(null);
  const geoJsonLayerRef = useRef<LeafletGeoJSON | null>(null);

  const initialCenter: LatLngExpression = [12.8797, 121.774]; // Philippines center
  const initialZoom = 6;

  // Export data function
  const handleExportData = async () => {
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
  };

  // Build filter string for Meilisearch
  const buildFilterString = (): string => {
    return 'type = "flood_control"';
  };

  // Build geo search parameters for Meilisearch aroundLatLng
  const buildGeoSearchParams = () => {
    if (!geoSearch) return {};

    // Use Meilisearch's aroundLatLng functionality
    return {
      aroundLatLng: `${geoSearch.lat}, ${geoSearch.lng}`,
      aroundRadius: Math.round(geoSearch.radius), // Convert to meters (integer)
    };
  };

  const getRegionName = (
    feature: GeoJSON.Feature<GeoJSON.Geometry, RegionProperties>
  ): string => {
    const props = feature.properties;
    return props?.name || '';
  };

  // Style for GeoJSON features
  const regionStyle = (
    feature?: GeoJSON.Feature<GeoJSON.Geometry, RegionProperties>
  ) => {
    if (!feature) return {};
    const regionName = getRegionName(feature);
    const isSelected = selectedRegion?.id === regionName;
    const isHovered = hoveredRegionName === regionName;

    return {
      fillColor: isSelected ? '#6D28D9' : isHovered ? '#A78BFA' : '#EDE9FE',
      weight: isSelected || isHovered ? 2 : 1,
      opacity: 1,
      color: isSelected || isHovered ? '#4C1D95' : '#A78BFA',
      fillOpacity: 0.7,
    };
  };

  // Calculate region center and radius from bounds
  const calculateGeoSearchParams = useCallback((bounds: L.LatLngBounds) => {
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

  // Note: Client-side filtering is no longer needed since we use Meilisearch's aroundLatLng

  // Since we're now using Meilisearch's native geo search,
  // filteredProjects is just the mapProjects returned from the search
  const filteredProjects = mapProjects;

  // Memoize valid projects and marker rendering
  const { validProjects, shouldCluster, markerIcon } = useMemo(() => {
    const valid = filteredProjects.filter((project: FloodControlProject) => {
      if (!project.Latitude || !project.Longitude) return false;
      const lat = parseFloat(project.Latitude);
      const lng = parseFloat(project.Longitude);
      return !isNaN(lat) && !isNaN(lng);
    });

    const icon = L.icon({
      iconUrl: '/marker-icon-2x.webp',
      iconSize: [16, 24],
      iconAnchor: [8, 8],
      popupAnchor: [0, -25],
    });

    return {
      validProjects: valid,
      shouldCluster: valid.length > 10,
      markerIcon: icon,
    };
  }, [filteredProjects]);

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

  // Handle region click
  const onRegionClick = useCallback(
    (feature: GeoJSON.Feature<GeoJSON.Geometry, RegionProperties>) => {
      if (!feature.properties) return;
      const props = feature.properties;
      const regionName = props.name;

      // Get the bounding box of the region and calculate geo search parameters
      const bounds = L.geoJSON(feature.geometry).getBounds();
      const geoParams = calculateGeoSearchParams(bounds);
      setGeoSearch(geoParams);

      // Set loading state first
      const regionDetails: RegionData = {
        id: regionName,
        name: regionName,
        loading: true,
      };
      setSelectedRegion(regionDetails);

      // Only zoom/fit bounds if we're not already zoomed in (zoom level <= 8)
      if (mapRef.current && feature.geometry && zoomLevel <= 8) {
        mapRef.current.fitBounds(bounds, { padding: [20, 20] });
        // Force zoom to at least level 9 to show project pins
        setTimeout(() => {
          if (mapRef.current && mapRef.current.getZoom() < 9) {
            mapRef.current.setZoom(9);
          }
          setZoomLevel(mapRef.current?.getZoom() || 9);
        }, 500);
      } else if (mapRef.current) {
        // If already zoomed in, just update the zoom level state without changing the view
        setZoomLevel(mapRef.current.getZoom());
      }
    },
    [calculateGeoSearchParams, zoomLevel]
  );

  // Event handlers for each feature
  const onEachFeature = (
    feature: GeoJSON.Feature<GeoJSON.Geometry, RegionProperties>,
    layer: Layer
  ) => {
    layer.on({
      click: () => onRegionClick(feature),
      mouseover: e => {
        // Disable hover effects when zoomed in (zoom level > 8)
        if (zoomLevel <= 8) {
          setHoveredRegionName(getRegionName(feature));
          // e.target.setStyle(regionStyle(feature)) // Re-apply style with hover state
          e.target.bringToFront();
        }
      },
      mouseout: e => {
        // Only reset hover state if we're not zoomed in
        if (zoomLevel <= 8) {
          setHoveredRegionName(null);
          // Reset to default style or selected style if it's the selected region
          if (geoJsonLayerRef.current) {
            geoJsonLayerRef.current.resetStyle(e.target);
          }
        }
      },
    });
  };

  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();

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
              <MapContainer
                center={initialCenter}
                zoom={initialZoom}
                style={{ height: '100%', width: '100%' }}
                className='z-0'
                ref={mapRef}
                whenReady={() => {
                  if (mapRef.current) {
                    mapRef.current.on('zoomend', () => {
                      if (mapRef.current) {
                        setZoomLevel(mapRef.current.getZoom());
                      }
                    });
                  }
                }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                />

                {mapData && mapData.features && (
                  <GeoJSON
                    ref={geoJsonLayerRef}
                    data={mapData}
                    style={regionStyle}
                    onEachFeature={onEachFeature}
                  />
                )}

                {/* Show project markers when zoomed in or region is selected */}
                {(zoomLevel > 8 || selectedRegion) &&
                  validProjects.length > 0 &&
                  (shouldCluster ? (
                    <MarkerClusterGroup
                      chunkedLoading
                      spiderfyOnMaxZoom={true}
                      showCoverageOnHover={false}
                      zoomToBoundsOnClick={true}
                    >
                      {validProjects.map((project: FloodControlProject) => (
                        <ProjectMarker
                          key={project.GlobalID || project.objectID}
                          project={project}
                          icon={markerIcon}
                        />
                      ))}
                    </MarkerClusterGroup>
                  ) : (
                    validProjects.map((project: FloodControlProject) => (
                      <ProjectMarker
                        key={project.GlobalID || project.objectID}
                        project={project}
                        icon={markerIcon}
                      />
                    ))
                  ))}
              </MapContainer>

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
