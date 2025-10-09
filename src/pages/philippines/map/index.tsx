import L, { LatLngExpression, Layer, GeoJSON as LeafletGeoJSON } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Building2Icon,
  Loader2Icon,
  MapPinIcon,
  RefreshCcwIcon,
  SearchIcon,
  UsersIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from 'lucide-react';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { GeoJSON, MapContainer, TileLayer } from 'react-leaflet';
import Button from '../../../components/ui/Button';
import { ScrollArea } from '../../../components/ui/ScrollArea';
import philippinesRegionsData from '../../../data/philippines-regions.json'; // Renamed for clarity
import pop2020Raw from '../../../data/population-2020.json';
import { resolveRegionPopulationKey } from '../../../lib/regionMapping';

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
}

interface RegionProperties {
  name: string; // Region name from GeoJSON
  capital?: string;
  population?: string;
  provinces?: string[];
  // Add other properties from your GeoJSON if needed
}

// Minimal type for population JSON
interface PopulationEntry {
  totalPopulation: number;
  householdPopulation: number;
  households: number;
}
interface Population2020Data {
  regions: Record<string, PopulationEntry>;
  provincesOrHUCS: Record<string, PopulationEntry>;
}
const pop2020 = pop2020Raw as unknown as Population2020Data;

// Wikipedia data cache
const wikipediaCache = new Map<
  string,
  { content?: string; summary?: string; [key: string]: unknown }
>();

const initialCenter: LatLngExpression = [12.8797, 121.774]; // Philippines center

const PhilippinesMap: FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<RegionData | null>(null);
  const [hoveredRegionName, setHoveredRegionName] = useState<string | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState('');
  // GeoJSON data expects FeatureCollection structure
  const [mapData] = useState<
    GeoJSON.FeatureCollection<GeoJSON.Geometry, RegionProperties>
  >(
    philippinesRegionsData as GeoJSON.FeatureCollection<
      GeoJSON.Geometry,
      RegionProperties
    >
  );
  const mapRef = useRef<L.Map>(null);
  const geoJsonLayerRef = useRef<LeafletGeoJSON | null>(null);

  const initialZoom = 6;

  // Fetch Wikipedia data
  const fetchWikipediaData = useCallback(async (regionName: string) => {
    if (wikipediaCache.has(regionName)) {
      return wikipediaCache.get(regionName);
    }
    try {
      const formattedName = regionName.split(' ').join('_');
      const searchUrls = [
        `${formattedName}_region`,
        formattedName,
        `${formattedName},_Philippines`,
      ];

      for (const url of searchUrls) {
        try {
          const response = await fetch(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(url)}`
          );
          if (response.ok) {
            const data = await response.json();
            wikipediaCache.set(regionName, data);
            return data;
          }
        } catch {
          console.warn(`Wikipedia fetch failed for: ${url}`);
        }
      }
      return null;
    } catch (err) {
      console.error('Error fetching Wikipedia data:', err);
      return null;
    }
  }, []);

  // Handle region click
  const onRegionClick = useCallback(
    async (feature: GeoJSON.Feature<GeoJSON.Geometry, RegionProperties>) => {
      if (!feature.properties) return;
      const props = feature.properties;
      const regionName = props.name;
      mapRef.current?.setZoom(7);

      //get center coordinates from feature geometry
      let center: LatLngExpression;
      if (feature.geometry.type === 'Polygon') {
        //extract the first coordinate from the first polygon
        //these coorddinates are from /data/philippines-regions.json
        const [[lng, lat]] = feature.geometry.coordinates[0];
        center = [lat, lng];
      } else if (feature.geometry.type === 'MultiPolygon') {
        const [[[[lng, lat]]]] = feature.geometry.coordinates;
        center = [lat, lng];
      } else {
        center = initialCenter;
      }
      mapRef.current?.flyTo(center, 7);

      const popKey = resolveRegionPopulationKey(regionName.toUpperCase());

      const populationNumber = pop2020?.regions?.[popKey]?.totalPopulation;

      const populationFormatted =
        typeof populationNumber === 'number'
          ? populationNumber.toLocaleString('en-PH')
          : undefined;

      const regionDetails: RegionData = {
        id: regionName,
        name: regionName,
        capital: props.capital,
        population: populationFormatted,
        // provinces: props.provinces,
        loading: true,
      };
      setSelectedRegion(regionDetails);

      const wikiData = await fetchWikipediaData(regionName);
      setSelectedRegion(prev => ({
        ...prev!,
        description: wikiData?.extract || 'No description available.',
        wikipedia: wikiData?.content_urls?.desktop?.page,
        loading: false,
      }));
    },
    [fetchWikipediaData]
  );

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
    const isFilteredOut =
      searchQuery &&
      !regionName.toLowerCase().includes(searchQuery.toLowerCase());

    return {
      fillColor: isSelected
        ? '#6D28D9'
        : isHovered
          ? '#A78BFA'
          : isFilteredOut
            ? '#D1D5DB'
            : '#EDE9FE',
      weight: isSelected || isHovered ? 2 : 1,
      opacity: 1,
      color: isSelected || isHovered ? '#4C1D95' : '#A78BFA',
      fillOpacity: isFilteredOut ? 0.3 : 0.7,
    };
  };

  // Event handlers for each feature
  const onEachFeature = (
    feature: GeoJSON.Feature<GeoJSON.Geometry, RegionProperties>,
    layer: Layer
  ) => {
    layer.on({
      click: () => onRegionClick(feature),
      mouseover: e => {
        setHoveredRegionName(getRegionName(feature));
        e.target.setStyle(regionStyle(feature)); // Re-apply style with hover state
        e.target.bringToFront();
      },
      mouseout: e => {
        setHoveredRegionName(null);
        // Reset to default style or selected style if it's the selected region
        if (geoJsonLayerRef.current) {
          geoJsonLayerRef.current.resetStyle(e.target);
        }
      },
    });
  };

  // Effect to update GeoJSON layer when search query changes (to re-apply styles for filtered out items)
  useEffect(() => {
    if (geoJsonLayerRef.current) {
      geoJsonLayerRef.current.clearLayers();
      geoJsonLayerRef.current.addData(mapData); // Add all data, styling will handle filter appearance
    }
  }, [searchQuery, mapData]);

  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();
  const handleResetZoom = () => {
    mapRef.current?.setZoom(initialZoom);
    mapRef.current?.flyTo(initialCenter, initialZoom);
  };

  useEffect(() => {
    const zoomControls = document.getElementById('zoom-controls');
    if (selectedRegion) {
      zoomControls?.classList.add('right-105');
    } else {
      zoomControls?.classList.remove('right-105');
    }
  }, [selectedRegion]);

  return (
    <div className='flex h-screen bg-gray-50'>
      {/* Map Section */}
      <div className='flex-1 relative'>
        {/* Search Bar */}
        <div className='absolute top-4 left-4 right-4 z-1000 max-w-md'>
          <div className='relative'>
            <SearchIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5' />
            <input
              type='text'
              placeholder='Search regions...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className='w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg shadow-xs focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:border-transparent'
            />
          </div>
        </div>

        {/* Zoom Controls - Leaflet has its own, but we can add custom ones */}
        <div
          id='zoom-controls'
          className='absolute top-5 right-4 z-10 flex flex-col gap-2'
        >
          <Button
            variant='primary'
            size='sm'
            onClick={handleResetZoom}
            aria-label='Reset zoom'
          >
            <RefreshCcwIcon className='h-4 w-4' />
          </Button>
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

        {/* <MapContainer
          center={[51.505, -0.09]}
          zoom={13}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        </MapContainer> */}

        <MapContainer
          center={initialCenter}
          zoom={initialZoom}
          ref={mapRef}
          zoomControl={false}
          style={{ height: '100%', width: '100%' }}
          // whenCreated={(mapInstance) => (mapRef.current = mapInstance)}
          className='z-0'
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          />
          {mapData && mapData.features && (
            <GeoJSON
              key={searchQuery} // Re-render GeoJSON on search change to apply filtering style
              ref={geoJsonLayerRef}
              data={mapData} // Always pass full data, style function handles visual filtering
              style={regionStyle}
              onEachFeature={onEachFeature}
            />
          )}
        </MapContainer>

        {/* Hover Tooltip - Can be implemented differently with Leaflet, e.g., L.tooltip */}
        {hoveredRegionName && (
          <div className='absolute bottom-4 left-4 bg-white px-4 py-2 rounded-lg shadow-lg z-1000'>
            <p className='text-sm font-medium text-gray-800'>
              {hoveredRegionName}
            </p>
          </div>
        )}
      </div>

      {selectedRegion && (
        <div
          className={`absolute right-0 top-20px h-full w-[400px] bg-white shadow-xl transition-transform duration-300 z-10 ${
            selectedRegion ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className='h-full flex flex-col'>
            <div className='p-6 border-b border-gray-200'>
              <div className='flex items-start justify-between'>
                <div className='flex-1'>
                  <h2 className='text-2xl font-bold text-gray-900'>
                    {selectedRegion.name}
                  </h2>
                  <p className='text-sm text-gray-800 mt-1 mb-4'>
                    Philippine Region
                  </p>

                  {/* Quick Facts in Header */}
                  <div className='flex flex-wrap gap-3'>
                    <div
                      className='flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full cursor-help group relative'
                      title='Capital City'
                    >
                      <Building2Icon className='h-4 w-4 text-blue-600' />
                      <span className='text-sm font-medium text-blue-800'>
                        {selectedRegion.capital}
                      </span>
                      {/* Tooltip */}
                      <div className='absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50'>
                        Capital City
                        <div className='absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900'></div>
                      </div>
                    </div>

                    <div
                      className='flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full cursor-help group relative'
                      title='Total Population'
                    >
                      <UsersIcon className='h-4 w-4 text-green-600' />
                      <span className='text-sm font-medium text-green-800'>
                        {selectedRegion.population}
                      </span>
                      {/* Tooltip */}
                      <div className='absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50'>
                        Total Population (2020)
                        <div className='absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900'></div>
                      </div>
                    </div>

                    <div
                      className='flex items-center gap-2 bg-purple-50 px-3 py-1.5 rounded-full cursor-help group relative'
                      title='Land Area'
                    >
                      <MapPinIcon className='h-4 w-4 text-purple-600' />
                      <span className='text-sm font-medium text-purple-800'>
                        {selectedRegion.area}
                      </span>
                      {/* Tooltip */}
                      <div className='absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50'>
                        Land Area (km²)
                        <div className='absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900'></div>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRegion(null)}
                  className='text-gray-400 hover:text-gray-800'
                >
                  <svg
                    className='h-6 w-6'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M6 18L18 6M6 6l12 12'
                    />
                  </svg>
                </button>
              </div>
            </div>
            <ScrollArea className='flex-1'>
              <div className='p-6 space-y-6'>
                {selectedRegion.loading ? (
                  <div className='flex items-center justify-center py-12'>
                    <Loader2Icon className='h-8 w-8 animate-spin text-purple-600' />
                  </div>
                ) : (
                  <>
                    <div>
                      <div className='flex items-center justify-between mb-2'>
                        <h3 className='text-lg font-semibold text-gray-900'>
                          Overview
                        </h3>
                        <a
                          href={`https://en.wikipedia.org/wiki/${selectedRegion.name.replace(/\s+/g, '_')}`}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200 flex items-center gap-1'
                        >
                          Learn More
                          <svg
                            className='h-3 w-3'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14'
                            />
                          </svg>
                        </a>
                      </div>
                      <p className='text-gray-800 leading-relaxed'>
                        {selectedRegion.description}
                      </p>
                    </div>
                    {selectedRegion.provinces &&
                      selectedRegion.provinces.length > 0 && (
                        <div>
                          <h3 className='text-lg font-semibold text-gray-900 mb-3'>
                            Provinces
                          </h3>
                          <div className='flex flex-wrap gap-2'>
                            {selectedRegion.provinces.map(province => (
                              <span
                                key={province}
                                className='px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm'
                              >
                                {province}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                  </>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhilippinesMap;
