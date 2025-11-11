import 'instantsearch.css/themes/satellite.css';
import { DownloadIcon } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';
import { FC, useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Configure, InstantSearch, useHits } from 'react-instantsearch';
import Button from '../../components/ui/Button';
import { exportMeilisearchData } from '../../lib/exportData';
import FloodControlProjectsTab from './tab';

// Import region data
import { FloodYearEnum } from '@/enum/map.enum';
import { instantMeiliSearch } from '@meilisearch/instant-meilisearch';
import philippinesRegionsData from '../../data/philippines-regions.json';
import About from './components/About';
import MapControls from './components/MapControls';
import SimulationControls from './components/SimulationControls';
import { useMapbox } from './hooks/useMapbox';
import {
  IFloodControlProject,
  IMapFloodSimulationState,
  IMapStyle,
  IRegionData,
  IRegionProperties,
} from './types';

// Custom component to access Meilisearch hits for map
const MapHitsComponent = ({
  onHitsUpdate,
}: {
  onHitsUpdate: (hits: IFloodControlProject[]) => void;
}) => {
  const { hits } = useHits<IFloodControlProject>();

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
  const [selectedFloodYear, setSelectedFloodYear] = useState<FloodYearEnum>(
    FloodYearEnum.FIVE_YEAR
  );
  const [selectedRegion, setSelectedRegion] = useState<IRegionData | null>(
    null
  );
  const [hoveredRegionName, setHoveredRegionName] = useState<string | null>(
    null
  );
  const [mapData] = useState<
    GeoJSON.FeatureCollection<GeoJSON.Geometry, IRegionProperties>
  >(
    philippinesRegionsData as GeoJSON.FeatureCollection<
      GeoJSON.Geometry,
      IRegionProperties
    >
  );
  const [simulation, setSimulation] = useState<IMapFloodSimulationState>({
    floodDepth: 0,
    simulating: false,
  });
  const [mapStyle, setMapStyle] = useState<IMapStyle>({
    style: 'standard',
    showRain: false,
  });
  const [mapProjects, setMapProjects] = useState<IFloodControlProject[]>([]);

  const {
    mapContainer,
    handleZoomIn,
    handleZoomOut,
    handleSwitchMapStyle,
    toggleFloodSimulation,
    handleStopSimulation,
  } = useMapbox({
    mapData,
    selectedFloodYear,
    setGeoSearch,
    setSelectedRegion,
    setHoveredRegionName,
    filteredProjects: mapProjects,
    mapStyle,
    simulation,
    setSimulation,
    setMapStyle,
    selectedRegion,
    hoveredRegionName,
  });

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
  const buildFilterString = (): string => {
    return 'type = "flood_control"';
  };

  // Build geo search parameters for Meilisearch aroundLatLng
  const buildGeoSearchParams = useCallback(() => {
    if (!geoSearch) return {};

    // Use Meilisearch's aroundLatLng functionality
    return {
      aroundLatLng: `${geoSearch.lat}, ${geoSearch.lng}`,
      aroundRadius: Math.round(geoSearch.radius), // Convert to meters (integer)
    };
  }, [geoSearch]);

  useEffect(() => {
    if (selectedRegion && !selectedRegion.loading) {
      const projects = mapProjects;
      const totalProjects = projects.length;
      const totalCost = projects.reduce(
        (sum: number, project: IFloodControlProject) => {
          const cost = parseFloat(project.ContractCost || '0');
          return sum + (isNaN(cost) ? 0 : cost);
        },
        0
      );
      const uniqueContractors = new Set(
        projects
          .map((project: IFloodControlProject) => project.Contractor)
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
  }, [mapProjects, selectedRegion]);

  return (
    <div className='min-h-screen bg-gray-50'>
      <Helmet>
        <title>Flood Control Projects Map | BetterGov.ph</title>
        <meta
          name='description'
          content='Explore flood control projects on an interactive map'
        />
      </Helmet>

      <div className='container mx-auto px-4 py-8'>
        <div className='flex flex-col gap-6'>
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

          <FloodControlProjectsTab selectedTab='map' />

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
              <MapControls
                mapStyle={mapStyle}
                handleZoomIn={handleZoomIn}
                handleZoomOut={handleZoomOut}
                handleSwitchMapStyle={handleSwitchMapStyle}
              />
              <SimulationControls
                simulation={simulation}
                selectedFloodYear={selectedFloodYear}
                setSelectedFloodYear={setSelectedFloodYear}
                toggleFloodSimulation={toggleFloodSimulation}
                handleStopSimulation={handleStopSimulation}
              />
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
          <About />
        </div>
      </div>
    </div>
  );
};

export default FloodControlProjectsMap;
