import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import 'instantsearch.css/themes/satellite.css';
import { exportMeilisearchData } from '../../lib/exportData';
import { DownloadIcon, InfoIcon, ZoomInIcon, ZoomOutIcon } from 'lucide-react';
import Button from '../../components/ui/Button';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from 'react-leaflet';
import L, { LatLngExpression, GeoJSON as LeafletGeoJSON, Layer } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import FloodControlProjectsTab from './tab';

// Import region data
import philippinesRegionsData from '../../data/philippines-regions.json';
import regionData from '../../data/region-mapping.json';

// Meilisearch configuration for InstantSearch

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
  rendered?: boolean; // Added for progressive loading
}

// Main map component
const FloodControlProjectsMapWithInstantSearch: React.FC<{
  onShowAll: () => void;
}> = () => {
  // Loading state for export
  const [isExporting, setIsExporting] = useState<boolean>(false);

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [mapProjects, setMapProjects] = useState<FloodControlProject[]>([]);

  // Progressive loading state
  const [loadedProjects, setLoadedProjects] = useState<FloodControlProject[]>(
    []
  );

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const initialLoadDone = useRef(false);
  const progressiveLoadingStarted = useRef(false);
  const progressiveLoadingCancelled = useRef(false);
  const progressiveInterval = useRef<NodeJS.Timeout | null>(null);
  const globalOffset = useRef(10); // Start from offset 10 since we already have first 10 items

  // Region mapping and totals loaded from JSON file
  // This is an optimization since we can save calling the API for total every time a user loads the page
  const {
    regionMapping,
    regionTotals,
    defaultRegionTotal,
    globalTotal,
    globalTotalPages,
  } = regionData;

  // Standalone progressive loading function
  const startProgressiveLoading = useCallback(() => {
    if (
      progressiveLoadingStarted.current ||
      progressiveLoadingCancelled.current
    )
      return;
    progressiveLoadingStarted.current = true;

    const loadMore = async () => {
      if (isLoadingMore || progressiveLoadingCancelled.current) return;

      setIsLoadingMore(true);

      try {
        const currentOffset = globalOffset.current;
        const currentPage = Math.floor(currentOffset / 10) + 1;

        const MEILISEARCH_HOST =
          import.meta.env.VITE_MEILISEARCH_HOST || 'http://localhost';
        const MEILISEARCH_PORT =
          import.meta.env.VITE_MEILISEARCH_PORT || '7700';
        const response = await fetch(
          `${MEILISEARCH_HOST}:${MEILISEARCH_PORT}/indexes/bettergov_flood_control/search`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_MEILISEARCH_SEARCH_API_KEY || ''}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              hitsPerPage: 10,
              page: currentPage,
              filter: 'type = "flood_control"',
            }),
          }
        );

        const data = await response.json();
        const newProjects = data.hits || [];

        if (
          loadedProjects.length >= globalTotal ||
          currentPage >= globalTotalPages
        ) {
          // Reached maximum projects or pages, stopping progressive loading
        } else if (currentPage === globalTotalPages) {
          // Special handling for last page - might have fewer than 10 items
          setLoadedProjects(prev => [...prev, ...newProjects]);
          setMapProjects(prev => [...prev, ...newProjects]);
        } else {
          setLoadedProjects(prev => [...prev, ...newProjects]);
          setMapProjects(prev => [...prev, ...newProjects]);
          globalOffset.current += 1000; // Jump 1000 items (100 pages) for faster loading

          // Schedule next load only if not cancelled
          if (!progressiveLoadingCancelled.current) {
            setTimeout(loadMore, 1000);
          }
        }
      } catch (error) {
        console.error('Error loading more projects:', error);
      } finally {
        setIsLoadingMore(false);
      }
    };

    // Start the chain only if not cancelled
    if (!progressiveLoadingCancelled.current) {
      setTimeout(loadMore, 1000);
    }
  }, [isLoadingMore, loadedProjects.length, globalTotal, globalTotalPages]);

  // Function to load all projects progressively (for Show All button)
  const loadAllProjects = async () => {
    // Cancel all ongoing operations
    progressiveLoadingCancelled.current = true;
    progressiveLoadingStarted.current = false;
    setIsLoadingMore(false);

    // Clear any existing timeouts/intervals
    if (progressiveInterval.current) {
      clearInterval(progressiveInterval.current);
      progressiveInterval.current = null;
    }

    // Reset states
    setSelectedRegion(null);
    setIsLoading(true);
    setLoadedProjects([]);
    setMapProjects([]);

    // Reset loading flags
    initialLoadDone.current = false;
    progressiveLoadingCancelled.current = false;

    try {
      const MEILISEARCH_HOST =
        import.meta.env.VITE_MEILISEARCH_HOST || 'http://localhost';
      const MEILISEARCH_PORT = import.meta.env.VITE_MEILISEARCH_PORT || '7700';

      // Load first batch of 200 projects
      const response = await fetch(
        `${MEILISEARCH_HOST}:${MEILISEARCH_PORT}/indexes/bettergov_flood_control/search`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_MEILISEARCH_SEARCH_API_KEY || ''}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            hitsPerPage: 200,
            page: 1,
            filter: 'type = "flood_control"',
          }),
        }
      );

      const data = await response.json();
      const allProjects = data.hits || [];
      setLoadedProjects(allProjects);
      setMapProjects(allProjects);

      // Start progressive loading for remaining projects (200 per batch, 1 second intervals)
      const totalHits = data.totalHits || 0;
      const totalPages = Math.ceil(totalHits / 200);

      if (totalPages > 1 && totalHits > 200) {
        let currentPage = 2;
        progressiveLoadingStarted.current = true;

        const loadMore = async () => {
          if (isLoadingMore || progressiveLoadingCancelled.current) return;

          setIsLoadingMore(true);

          try {
            const response = await fetch(
              `${MEILISEARCH_HOST}:${MEILISEARCH_PORT}/indexes/bettergov_flood_control/search`,
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${import.meta.env.VITE_MEILISEARCH_SEARCH_API_KEY || ''}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  hitsPerPage: 200,
                  page: currentPage,
                  filter: 'type = "flood_control"',
                }),
              }
            );

            const data = await response.json();
            const newProjects = data.hits || [];

            if (
              newProjects.length > 0 &&
              !progressiveLoadingCancelled.current
            ) {
              setLoadedProjects(prev => [...prev, ...newProjects]);
              setMapProjects(prev => [...prev, ...newProjects]);
              currentPage++;

              if (
                currentPage <= totalPages &&
                !progressiveLoadingCancelled.current
              ) {
                setTimeout(loadMore, 1000); // 1 second delay
              }
            }
          } catch (error) {
            console.error('Error loading more projects:', error);
          } finally {
            setIsLoadingMore(false);
          }
        };

        setTimeout(loadMore, 1000);
      }

      console.log('Show All clicked - progressive loading started');
    } catch (error) {
      console.error('Error loading global data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load initial 10 projects with optimized slow loading
  useEffect(() => {
    async function loadInitialData() {
      if (initialLoadDone.current || isLoading) return;

      setIsLoading(true);
      initialLoadDone.current = true;

      try {
        const MEILISEARCH_HOST =
          import.meta.env.VITE_MEILISEARCH_HOST || 'http://localhost';
        const MEILISEARCH_PORT =
          import.meta.env.VITE_MEILISEARCH_PORT || '7700';
        const response = await fetch(
          `${MEILISEARCH_HOST}:${MEILISEARCH_PORT}/indexes/bettergov_flood_control/search`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_MEILISEARCH_SEARCH_API_KEY || ''}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              hitsPerPage: 10,
              page: 1,
              filter: 'type = "flood_control"',
            }),
          }
        );

        const data = await response.json();
        setLoadedProjects(data.hits || []);
        setMapProjects(data.hits || []);

        // Start progressive loading after initial load (10 per batch, 1 second intervals)
        setTimeout(() => {
          startProgressiveLoading();
        }, 1000);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialData();
  }, [isLoading, startProgressiveLoading]); // Include dependencies

  const [zoomLevel, setZoomLevel] = useState<number>(6); // Start with initial zoom
  const mapRef = useRef<L.Map>(null);
  const geoJsonLayerRef = useRef<LeafletGeoJSON | null>(null);
  const [isRegionClicking, setIsRegionClicking] = useState<boolean>(false);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Progressive marker loading state

  const initialCenter: LatLngExpression = [12.8797, 121.774]; // Philippines center
  const initialZoom = 6;

  // Export data function
  const handleExportData = async () => {
    // Set loading state
    setIsExporting(true);

    try {
      await exportMeilisearchData({
        host: import.meta.env.VITE_MEILISEARCH_HOST || 'http://localhost',
        port: import.meta.env.VITE_MEILISEARCH_PORT || '7700',
        apiKey: import.meta.env.VITE_MEILISEARCH_SEARCH_API_KEY || '',
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

  // Note: Client-side filtering is no longer needed since we use Meilisearch's aroundLatLng

  // Since we're now using Meilisearch's native geo search,
  // we use mapProjects directly for filtering

  // Debounced region click handler
  const onRegionClick = useCallback(
    async (feature: GeoJSON.Feature<GeoJSON.Geometry, RegionProperties>) => {
      if (!feature.properties || isRegionClicking) return;

      // Cancel global progressive loading forever when region is clicked
      progressiveLoadingCancelled.current = true;

      const props = feature.properties;
      const regionName = props.name;

      setIsRegionClicking(true);
      setSelectedRegion({ id: regionName, name: regionName, loading: true });

      // Stop any existing progressive loading (global or region)
      if (progressiveInterval.current) {
        clearInterval(progressiveInterval.current);
        progressiveInterval.current = null;
      }

      // Reset region progressive loading state only
      progressiveLoadingStarted.current = false;
      globalOffset.current = 0;
      setIsLoadingMore(false);

      try {
        // Use InstantSearch for region filtering (cached after first load)
        const meilisearchRegion =
          regionMapping[regionName as keyof typeof regionMapping] || regionName;

        // Load region data via API
        const MEILISEARCH_HOST =
          import.meta.env.VITE_MEILISEARCH_HOST || 'http://localhost';
        const MEILISEARCH_PORT =
          import.meta.env.VITE_MEILISEARCH_PORT || '7700';
        const response = await fetch(
          `${MEILISEARCH_HOST}:${MEILISEARCH_PORT}/indexes/bettergov_flood_control/search`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_MEILISEARCH_SEARCH_API_KEY || ''}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              hitsPerPage: 100,
              page: 1,
              filter: `type = "flood_control" AND Region = "${meilisearchRegion}"`,
            }),
          }
        );

        const data = await response.json();
        const regionProjects = data.hits || [];

        setLoadedProjects(regionProjects);
        setMapProjects(regionProjects);

        // Start progressive loading for this region if we got a full batch (100 items)
        // Use hardcoded region totals for efficient pagination
        const regionTotalHits =
          regionTotals[meilisearchRegion as keyof typeof regionTotals] ||
          defaultRegionTotal;
        const regionTotalPages = Math.ceil(regionTotalHits / 100); // 100 per batch

        if (
          regionProjects.length === 100 &&
          regionTotalPages > 1 &&
          regionTotalHits > 100 &&
          !progressiveLoadingStarted.current
        ) {
          let regionPage = 2; // Start from page 2 (since we already have page 1)
          progressiveLoadingStarted.current = true;

          const loadMoreRegion = async () => {
            if (isLoadingMore) return;

            setIsLoadingMore(true);

            try {
              const response = await fetch(
                `${MEILISEARCH_HOST}:${MEILISEARCH_PORT}/indexes/bettergov_flood_control/search`,
                {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${import.meta.env.VITE_MEILISEARCH_SEARCH_API_KEY || ''}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    hitsPerPage: 100,
                    page: regionPage,
                    filter: `type = "flood_control" AND Region = "${meilisearchRegion}"`,
                  }),
                }
              );

              const data = await response.json();
              const newProjects = data.hits || [];

              // Use JSON totals as source of truth, not API response
              if (
                regionPage >= regionTotalPages ||
                loadedProjects.length >= regionTotalHits
              ) {
                // Reached region limits, stopping progressive loading
              } else if (regionPage === regionTotalPages) {
                // Special handling for last page - might have fewer than 100 items
                setLoadedProjects(prev => [...prev, ...newProjects]);
                setMapProjects(prev => [...prev, ...newProjects]);
              } else {
                setLoadedProjects(prev => [...prev, ...newProjects]);
                setMapProjects(prev => [...prev, ...newProjects]);
                regionPage += 1; // Move to next page sequentially

                // Schedule next load
                setTimeout(loadMoreRegion, 1000);
              }
            } catch (error) {
              console.error('Error loading more region projects:', error);
            } finally {
              setIsLoadingMore(false);
            }
          };

          // Start the progressive loading chain
          setTimeout(loadMoreRegion, 1000);
        }

        setSelectedRegion({ id: regionName, name: regionName, loading: false });
      } catch (error) {
        console.error('Error loading region data:', error);
        setSelectedRegion({ id: regionName, name: regionName, loading: false });
      } finally {
        setIsRegionClicking(false);
      }
    },
    [
      isRegionClicking,
      regionMapping,
      defaultRegionTotal,
      isLoadingMore,
      loadedProjects.length,
      regionTotals,
    ]
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

  // Cleanup timeouts on unmount
  useEffect(() => {
    const clickTimeout = clickTimeoutRef.current;

    return () => {
      if (clickTimeout) {
        clearTimeout(clickTimeout);
      }
    };
  }, []);

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
            >
              {isExporting ? 'Exporting...' : 'Export Data'}
            </Button>
          </div>

          {/* View Tabs */}
          <FloodControlProjectsTab selectedTab='map' />

          {/* Data is now fetched directly via AJAX on component mount */}

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

                {/* Show project markers when region is selected OR when we have loaded projects */}
                {(selectedRegion || loadedProjects.length > 0) &&
                  loadedProjects
                    .filter(project => {
                      if (!project.Latitude || !project.Longitude) return false;
                      const lat = parseFloat(project.Latitude);
                      const lng = parseFloat(project.Longitude);
                      return (
                        !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0
                      );
                    })
                    .map((project: FloodControlProject, index: number) => {
                      // Check if we have valid coordinates
                      if (!project.Latitude || !project.Longitude) {
                        return null;
                      }

                      const lat = parseFloat(project.Latitude);
                      const lng = parseFloat(project.Longitude);

                      // Validate coordinates
                      if (isNaN(lat) || isNaN(lng)) {
                        return null;
                      }

                      return (
                        <Marker
                          key={`${project.GlobalID || project.objectID}-${index}`}
                          position={[lat, lng]}
                          icon={L.icon({
                            iconUrl: '/marker-icon-2x.webp',
                            iconSize: [16, 24],
                            iconAnchor: [8, 8],
                            popupAnchor: [0, -25],
                            shadowUrl: '/marker-shadow.webp',
                            shadowSize: [41, 41],
                            shadowAnchor: [14, 24],
                          })}
                        >
                          <Popup>
                            <div className='min-w-[200px]'>
                              <h3 className='font-bold text-gray-900'>
                                {project.ProjectDescription ||
                                  'Unnamed Project'}
                              </h3>
                              <p className='text-sm text-gray-800 mt-1'>
                                <strong>Region:</strong>{' '}
                                {project.Region || 'N/A'}
                              </p>
                              <p className='text-sm text-gray-800'>
                                <strong>Province:</strong>{' '}
                                {project.Province || 'N/A'}
                              </p>
                              <p className='text-sm text-gray-800'>
                                <strong>Municipality:</strong>{' '}
                                {project.Municipality || 'N/A'}
                              </p>
                              <p className='text-sm text-gray-800'>
                                <strong>Contractor:</strong>{' '}
                                {project.Contractor || 'N/A'}
                              </p>
                              <p className='text-sm text-gray-800'>
                                <strong>Cost:</strong> ₱
                                {project.ContractCost
                                  ? Number(
                                      project.ContractCost
                                    ).toLocaleString()
                                  : 'N/A'}
                              </p>
                              <p className='text-sm text-gray-800'>
                                <strong>Year:</strong>{' '}
                                {project.InfraYear || 'N/A'}
                              </p>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}
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
                      onClick={resetToGlobalView}
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
                            mapProjects.filter(
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

          {/* Show All Regions Button */}
          <div className='bg-white rounded-lg shadow-md p-4'>
            <p className='text-xs text-blue-600 mb-1 text-center'>
              ℹ️ Info: The markers you see are not all the projects but just a
              very small set of data.
              <br />
              💡 Recommended: Click on a region to load all markers for that
              region in an optimized way.
            </p>
            <p className='text-xs text-red-600 mb-2 text-center'>
              ⚠️ Warning: your device will be flooded unless you have powerful
              desktop and fast internet
            </p>
            <div className='flex justify-center'>
              <button
                onClick={loadAllProjects}
                className='bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200'
              >
                🌍 Show All
              </button>
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

// Main component export
const FloodControlProjectsMap: React.FC = () => {
  return <FloodControlProjectsMapWithInstantSearch onShowAll={() => {}} />;
};

export default FloodControlProjectsMap;
