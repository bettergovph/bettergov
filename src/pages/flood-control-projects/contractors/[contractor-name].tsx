import { useState, useEffect, useRef, FC } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { InstantSearch, Configure, useHits } from 'react-instantsearch';
import { instantMeiliSearch } from '@meilisearch/instant-meilisearch';
import 'instantsearch.css/themes/satellite.css';
import { exportMeilisearchData } from '../../../lib/exportData';
import {
  ChevronLeft,
  Download,
  ArrowUpDown,
  Info,
  Building2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L, { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Import contractor data
import contractorData from '../../../data/flood_control/lookups/Contractor_with_counts.json';
import FloodControlProjectsTab from '../tab';

// Define types for our data
interface DataItem {
  value: string;
  count: number;
}

// Define contractor profile interface
interface ContractorProfile {
  slug: string;
  company_name: string;
  website?: string;
  phone?: string;
  email?: string;
  ceo?: string;
  employees?: number;
  description?: string;
  address?: string;
  license?: string;
  sec_registration?: string;
  incorporation_date?: string;
  locations?: string[];
  employee_count?: number;
  key_personnel?: Array<{ name: string; role: string }>;
  related_companies?: Array<{ title: string; url: string }>;
  sources?: Array<{ title: string; url: string }>;
  articles?: Array<{ title: string; url: string }>;
  created_at?: string;
  type?: string;
}

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

// Create contractors search client
const contractorsSearchInstance = instantMeiliSearch(
  `${MEILISEARCH_HOST}:${MEILISEARCH_PORT}`,
  MEILISEARCH_SEARCH_API_KEY,
  {
    primaryKey: 'slug',
    keepZeroFacets: true,
  }
);

// Extract the searchClient from meiliSearchInstance
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const searchClient = meiliSearchInstance.searchClient as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const contractorsSearchClient = contractorsSearchInstance.searchClient as any;

// Define hit component for search results
interface FloodControlProject {
  GlobalID?: string;
  objectID?: string;
  ProjectDescription?: string;
  Municipality?: string;
  Region?: string;
  Province?: string;
  ContractID?: string;
  ProjectID?: string;
  ContractCost?: number;
  TypeofWork?: string;
  LegislativeDistrict?: string;
  DistrictEngineeringOffice?: string;
  InfraYear?: string;
  Contractor?: string;
  Latitude?: string;
  Longitude?: string;
  slug?: string;
}

interface HitProps {
  hit: FloodControlProject;
}

// Table Row component
const TableRow: FC<HitProps> = ({ hit }) => {
  return (
    <tr className='border-b border-gray-200 hover:bg-gray-50'>
      <td className='px-4 py-3 text-sm'>{hit.ProjectDescription || 'N/A'}</td>
      <td className='px-4 py-3 text-sm'>{hit.InfraYear || 'N/A'}</td>
      <td className='px-4 py-3 text-sm'>{hit.Region || 'N/A'}</td>
      <td className='px-4 py-3 text-sm'>{hit.Province || 'N/A'}</td>
      <td className='px-4 py-3 text-sm'>{hit.Municipality || 'N/A'}</td>
      <td className='px-4 py-3 text-sm'>{hit.TypeofWork || 'N/A'}</td>
      <td className='px-4 py-3 text-sm text-right'>
        {hit.ContractCost
          ? `₱${Number(hit.ContractCost).toLocaleString()}`
          : 'N/A'}
      </td>
    </tr>
  );
};

// Define a more specific type for flood control project data
type FloodControlHit = {
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
  [key: string]: string | undefined;
};

// Statistics component for displaying summary data
const ResultsStatistics: FC<{
  hits: FloodControlHit[];
  totalHits: number;
  contractor: string;
}> = ({ hits, totalHits, contractor }) => {
  // Use total hits from Meilisearch for accurate count
  const totalCount = totalHits;

  // Calculate average cost based on visible hits sample
  const visibleHitsContractCost = hits.reduce((sum, hit) => {
    const cost = parseFloat(hit.ContractCost || '0');
    return sum + (isNaN(cost) ? 0 : cost);
  }, 0);

  // Estimate total contract cost based on average cost per project
  const avgCostPerProject =
    hits.length > 0 ? visibleHitsContractCost / hits.length : 0;
  const estimatedTotalContractCost = avgCostPerProject * totalCount;

  return (
    <div className='bg-white p-6 rounded-t-lg shadow-sm mb-6'>
      <div className='flex items-center mb-4'>
        <Building2 className='w-6 h-6 text-blue-600 mr-3' />
        <h3 className='text-3xl font-semibold text-gray-900'>{contractor}</h3>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <div className='bg-blue-50 p-4 rounded-md'>
          <p className='text-sm text-gray-800'>Total Projects</p>
          <p className='text-3xl font-bold text-blue-700'>
            {totalCount.toLocaleString()}
          </p>
        </div>
        <div className='bg-green-50 p-4 rounded-md'>
          <p className='text-sm text-gray-800'>Total Contract Cost</p>
          <p className='text-3xl md:text-sm lg:text-xl xl:text-3xl font-bold text-green-700'>
            ₱
            {estimatedTotalContractCost.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}
          </p>
        </div>
        <div className='bg-purple-50 p-4 rounded-md'>
          <p className='text-sm text-gray-800'>Average Project Cost</p>
          <p className='text-3xl md:text-sm lg:text-xl xl:text-3xl font-bold text-purple-700'>
            ₱
            {avgCostPerProject.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}
          </p>
        </div>
      </div>
    </div>
  );
};

// Custom component to access Meilisearch hits for map
const MapHits: FC<{
  onHitsUpdate: (hits: FloodControlProject[]) => void;
}> = ({ onHitsUpdate }) => {
  const { hits } = useHits<FloodControlProject>();

  useEffect(() => {
    onHitsUpdate(hits);
  }, [hits, onHitsUpdate]);

  return null;
};

// Custom component to fetch contractor profile
const ContractorProfileFetcher: FC<{
  onProfileUpdate: (profile: ContractorProfile | null) => void;
}> = ({ onProfileUpdate }) => {
  const { hits } = useHits<ContractorProfile>();

  useEffect(() => {
    // Should only return 1 record since we're searching by exact slug
    onProfileUpdate(hits.length > 0 ? hits[0] : null);
  }, [hits, onProfileUpdate]);

  return null;
};

// Custom Hits component for table view
const TableHits: FC<{ selectedContractor: string }> = ({
  selectedContractor,
}) => {
  const [sortField, setSortField] = useState<string>('ProjectDescription');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(0);
  const hitsPerPage = 20; // Number of records per page

  // Use useHits hook from react-instantsearch to access hits data directly
  const { hits, results } = useHits();

  // Sort hits based on current sort field and direction
  const sortedHits = [...hits].sort(
    (a: FloodControlHit, b: FloodControlHit) => {
      // Handle special case for ContractCost which needs numeric sorting
      if (sortField === 'ContractCost') {
        const costA = parseFloat(a[sortField] || '0');
        const costB = parseFloat(b[sortField] || '0');
        return sortDirection === 'asc' ? costA - costB : costB - costA;
      }

      // String comparison for other fields
      const valueA = a[sortField]?.toString().toLowerCase() || '';
      const valueB = b[sortField]?.toString().toLowerCase() || '';

      if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    }
  );

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortHeader: FC<{ field: string; label: string }> = ({
    field,
    label,
  }) => {
    const isActive = sortField === field;

    return (
      <th
        className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer'
        onClick={() => handleSort(field)}
      >
        <div className='flex items-center'>
          <span className={`${isActive ? 'text-blue-600' : 'text-gray-800'}`}>
            {label}
          </span>
          {isActive ? (
            sortDirection === 'asc' ? (
              <svg
                className='w-3 h-3 ml-1 text-blue-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M5 15l7-7 7 7'
                />
              </svg>
            ) : (
              <svg
                className='w-3 h-3 ml-1 text-blue-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M19 9l-7 7-7-7'
                />
              </svg>
            )
          ) : (
            <ArrowUpDown className='w-3 h-3 ml-1 text-gray-400' />
          )}
        </div>
      </th>
    );
  };

  // Pagination handler
  const handlePageChange = (selectedPage: number) => {
    setCurrentPage(selectedPage);
  };

  // Calculate page range for display
  const startIndex = currentPage * hitsPerPage;
  const endIndex = Math.min(startIndex + hitsPerPage, sortedHits.length);
  const paginatedHits = sortedHits.slice(startIndex, endIndex);

  // Calculate total pages
  const totalPages = Math.ceil(sortedHits.length / hitsPerPage);

  return (
    <div>
      {/* Add the statistics component */}
      <ResultsStatistics
        totalHits={results?.nbHits || 0}
        hits={hits as FloodControlHit[]}
        contractor={selectedContractor}
      />

      <div className='overflow-x-auto' style={{ maxHeight: '65vh' }}>
        <table className='min-w-full divide-y divide-gray-200'>
          <thead className='bg-gray-50'>
            <tr>
              <SortHeader
                field='ProjectDescription'
                label='Project Description'
              />
              <SortHeader field='InfraYear' label='Year' />
              <SortHeader field='Region' label='Region' />
              <SortHeader field='Province' label='Province' />
              <SortHeader field='Municipality' label='Municipality' />
              <SortHeader field='TypeofWork' label='Type of Work' />
              <SortHeader field='ContractCost' label='Contract Cost' />
            </tr>
          </thead>
          <tbody className='bg-white divide-y divide-gray-200'>
            {/* Render paginated hits as table rows */}
            {paginatedHits.map(hit => (
              <TableRow
                key={
                  typeof hit.GlobalID === 'string' ? hit.GlobalID : hit.objectID
                }
                hit={hit as unknown as FloodControlProject}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className='flex justify-between items-center border-t border-gray-200 px-4 py-3 sm:px-6 mt-4'>
          <div className='hidden sm:flex-1 sm:flex sm:items-center sm:justify-between'>
            <div>
              <p className='text-sm text-gray-700'>
                Showing <span className='font-medium'>{startIndex + 1}</span> to{' '}
                <span className='font-medium'>{endIndex}</span> of{' '}
                <span className='font-medium'>{sortedHits.length}</span> results
              </p>
            </div>
            <div>
              <nav
                className='relative z-0 inline-flex rounded-md shadow-xs -space-x-px'
                aria-label='Pagination'
              >
                {/* Previous page button */}
                <button
                  onClick={() => handlePageChange(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                    currentPage === 0
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <span className='sr-only'>Previous</span>
                  <svg
                    className='h-5 w-5'
                    xmlns='http://www.w3.org/2000/svg'
                    viewBox='0 0 20 20'
                    fill='currentColor'
                    aria-hidden='true'
                  >
                    <path
                      fillRule='evenodd'
                      d='M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z'
                      clipRule='evenodd'
                    />
                  </svg>
                </button>

                {/* Page number buttons */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Show up to 5 page buttons, centered around current page
                  let pageToShow;
                  if (totalPages <= 5) {
                    // If total pages <= 5, show all pages from 0 to totalPages-1
                    pageToShow = i;
                  } else if (currentPage < 3) {
                    // If near start, show pages 0-4
                    pageToShow = i;
                  } else if (currentPage > totalPages - 4) {
                    // If near end, show last 5 pages
                    pageToShow = totalPages - 5 + i;
                  } else {
                    // Otherwise show current page and 2 pages on either side
                    pageToShow = currentPage - 2 + i;
                  }

                  if (pageToShow >= totalPages) return null;

                  return (
                    <button
                      key={pageToShow}
                      onClick={() => handlePageChange(pageToShow)}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${
                        currentPage === pageToShow
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white text-gray-800 hover:bg-gray-50'
                      }`}
                    >
                      {pageToShow + 1}
                    </button>
                  );
                })}

                {/* Next page button */}
                <button
                  onClick={() =>
                    handlePageChange(Math.min(totalPages - 1, currentPage + 1))
                  }
                  disabled={currentPage >= totalPages - 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                    currentPage >= totalPages - 1
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <span className='sr-only'>Next</span>
                  <svg
                    className='h-5 w-5'
                    xmlns='http://www.w3.org/2000/svg'
                    viewBox='0 0 20 20'
                    fill='currentColor'
                    aria-hidden='true'
                  >
                    <path
                      fillRule='evenodd'
                      d='M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z'
                      clipRule='evenodd'
                    />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Utility function to create slug from contractor name
const createSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
};

// Utility function to find contractor by slug
const findContractorBySlug = (slug: string): DataItem | null => {
  return (
    contractorData.Contractor.find(
      contractor => createSlug(contractor.value) === slug
    ) || null
  );
};

const initialCenter: LatLngExpression = [12.8797, 121.774];

// Main Contractor Detail component
const ContractorDetail: FC = () => {
  const { 'contractor-name': contractorSlug } = useParams<{
    'contractor-name': string;
  }>();
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);
  const [contractor, setContractor] = useState<DataItem | null>(null);
  const [contractorProfile, setContractorProfile] =
    useState<ContractorProfile | null>(null);
  // Remove viewMode state since we'll show both views side by side
  const [mapProjects, setMapProjects] = useState<FloodControlProject[]>([]);
  const mapRef = useRef<L.Map>(null);

  const initialZoom = 6;

  // function to calculate bounds from projects with coordinates
  const calculateBounds = (
    projects: FloodControlProject[]
  ): L.LatLngBounds | null => {
    const validProjects = projects.filter(project => {
      if (!project.Latitude || !project.Longitude) return false;
      const lat = parseFloat(project.Latitude);
      const lng = parseFloat(project.Longitude);
      return !isNaN(lat) && !isNaN(lng);
    });

    if (validProjects.length === 0) return null;

    const lats = validProjects.map(p => parseFloat(p.Latitude!));
    const lngs = validProjects.map(p => parseFloat(p.Longitude!));

    const bounds = L.latLngBounds([
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    ]);

    return bounds;
  };

  // adjust map view based on project coordinates
  useEffect(() => {
    if (mapRef.current && mapProjects.length > 0) {
      const bounds = calculateBounds(mapProjects);

      if (bounds) {
        // it fit bounds to show all project locations with some padding
        mapRef.current.fitBounds(bounds, {
          padding: [20, 20],
          maxZoom: 10,
        });
      } else {
        //lets show the whole Philippines if there are no project coordinates
        mapRef.current.setView(initialCenter, initialZoom);
      }
    }
  }, [mapProjects, initialZoom]);

  useEffect(() => {
    if (contractorSlug) {
      const foundContractor = findContractorBySlug(contractorSlug);
      if (foundContractor) {
        setContractor(foundContractor);
      } else {
        // Contractor not found, redirect to contractors list
        navigate('/flood-control-projects/contractors');
      }
    }
  }, [contractorSlug, navigate]);

  // Build filter string for Meilisearch
  const buildFilterString = (): string => {
    const filters = ['type = "flood_control"'];

    // Add contractor filter if contractor is available
    if (contractor) {
      filters.push(`Contractor = "${contractor.value}"`);
    }

    return filters.join(' AND ');
  };

  // Export data function
  const handleExportData = async () => {
    if (!contractor) return;

    // Set loading state
    setIsExporting(true);

    // Use filter for type and contractor
    const filterString = buildFilterString();
    const searchTerm = contractor.value;

    try {
      await exportMeilisearchData({
        host: MEILISEARCH_HOST,
        port: MEILISEARCH_PORT,
        apiKey: MEILISEARCH_SEARCH_API_KEY,
        indexName: 'bettergov_flood_control',
        filters: filterString,
        searchTerm: searchTerm,
        filename: `flood-control-projects-${createSlug(contractor.value)}`,
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

  if (!contractor) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto'></div>
          <p className='mt-4 text-gray-800'>Loading contractor details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <Helmet>
        <title>
          {contractor.value} - Flood Control Projects | BetterGov.ph
        </title>
        <meta
          name='description'
          content={`View all flood control projects by ${contractor.value}. Total projects: ${contractor.count}`}
        />
      </Helmet>

      {/* Main layout */}
      <div className='container mx-auto px-4 py-8'>
        {/* Back button and breadcrumb */}
        <div className='mb-6'>
          <Link
            to='/flood-control-projects/contractors'
            className='inline-flex items-center text-blue-600 hover:text-blue-800 mb-4'
          >
            <ChevronLeft className='w-4 h-4 mr-1' />
            Back to Contractors
          </Link>

          <nav className='text-sm text-gray-800 mb-4'>
            <Link to='/' className='hover:text-blue-600'>
              Home
            </Link>
            <span className='mx-2'>/</span>
            <Link to='/flood-control-projects' className='hover:text-blue-600'>
              Flood Control Projects
            </Link>
            <span className='mx-2'>/</span>
            <Link
              to='/flood-control-projects/contractors'
              className='hover:text-blue-600'
            >
              Contractors
            </Link>
            <span className='mx-2'>/</span>
            <span className='text-gray-900'>{contractor.value}</span>
          </nav>
        </div>

        {/* View Tabs */}
        <FloodControlProjectsTab selectedTab='contractors' />

        {/* Contractor Profile Section */}
        {contractorProfile && (
          <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
              {/* Company Info */}
              <div className='lg:col-span-2'>
                <div className='flex items-start justify-between mb-4'>
                  <div>
                    <h1 className='text-3xl font-bold text-gray-900 mb-2'>
                      {contractorProfile.company_name}
                    </h1>
                    <p className='text-gray-800 mb-4'>
                      {contractorProfile.description ||
                        'Construction company specializing in flood control projects'}
                    </p>
                  </div>
                </div>

                {/* Contact Information */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
                  {contractorProfile.address && (
                    <div>
                      <h4 className='font-semibold text-gray-900 mb-1'>
                        Address
                      </h4>
                      <p className='text-gray-800 text-sm'>
                        {contractorProfile.address}
                      </p>
                    </div>
                  )}
                  {contractorProfile.phone && (
                    <div>
                      <h4 className='font-semibold text-gray-900 mb-1'>
                        Phone
                      </h4>
                      <p className='text-gray-800 text-sm'>
                        {contractorProfile.phone}
                      </p>
                    </div>
                  )}
                  {contractorProfile.email && (
                    <div>
                      <h4 className='font-semibold text-gray-900 mb-1'>
                        Email
                      </h4>
                      <p className='text-gray-800 text-sm'>
                        {contractorProfile.email}
                      </p>
                    </div>
                  )}
                  {contractorProfile.website && (
                    <div>
                      <h4 className='font-semibold text-gray-900 mb-1'>
                        Website
                      </h4>
                      <a
                        href={contractorProfile.website}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-blue-600 hover:text-blue-800 text-sm'
                      >
                        {contractorProfile.website}
                      </a>
                    </div>
                  )}
                </div>

                {/* Key Personnel */}
                {contractorProfile.key_personnel &&
                  contractorProfile.key_personnel.length > 0 && (
                    <div className='mb-4'>
                      <h4 className='font-semibold text-gray-900 mb-2'>
                        Key Personnel
                      </h4>
                      <div className='space-y-1'>
                        {contractorProfile.key_personnel.map(
                          (person, index) => (
                            <div key={index} className='text-sm text-gray-800'>
                              <span className='font-medium'>{person.name}</span>{' '}
                              - {person.role}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </div>

              {/* Company Stats */}
              <div>
                <div className='space-y-4'>
                  <div className='bg-blue-50 p-4 rounded-md'>
                    <p className='text-sm text-gray-800'>Total Projects</p>
                    <p className='text-2xl font-bold text-blue-700'>
                      {contractor?.count || 0}
                    </p>
                  </div>

                  {contractorProfile.sec_registration && (
                    <div className='bg-purple-50 p-4 rounded-md'>
                      <p className='text-sm text-gray-800'>SEC Registration</p>
                      <p className='text-sm font-medium text-purple-700'>
                        {contractorProfile.sec_registration}
                      </p>
                    </div>
                  )}

                  {contractorProfile.license && (
                    <div className='bg-orange-50 p-4 rounded-md'>
                      <p className='text-sm text-gray-800'>License</p>
                      <p className='text-sm text-orange-700'>
                        {contractorProfile.license}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fallback header if no profile found */}
        {!contractorProfile && (
          <div className='flex justify-between items-start mb-6'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900 mb-2'>
                {contractor?.value || 'Contractor'}
              </h1>
              <p className='text-gray-800'>
                Flood control projects contractor with {contractor?.count || 0}{' '}
                total projects
              </p>
            </div>

            <Button
              variant='outline'
              leftIcon={isExporting ? null : <Download className='w-4 h-4' />}
              onClick={handleExportData}
              disabled={isExporting}
              className='cursor-pointer'
            >
              {isExporting ? 'Exporting...' : 'Export Data'}
            </Button>
          </div>
        )}

        {/* Hidden InstantSearch for contractor profile */}
        {contractorSlug && (
          <InstantSearch
            indexName='contractors'
            searchClient={contractorsSearchClient}
            key={`contractor-profile-${contractorSlug}`}
          >
            <Configure
              hitsPerPage={1}
              filters={`slug = "${contractorSlug}"`}
              query=''
            />
            <ContractorProfileFetcher onProfileUpdate={setContractorProfile} />
          </InstantSearch>
        )}

        {/* Side by Side Content View */}
        <div className='flex flex-wrap gap-6'>
          {/* Table View */}
          <div className='bg-white flex-[0.7] rounded-lg shadow-md overflow-hidden mb-4'>
            <InstantSearch
              indexName='bettergov_flood_control'
              searchClient={searchClient}
              future={{ preserveSharedStateOnUnmount: true }}
              key={`search-table-${contractor.value}`}
            >
              <Configure
                hitsPerPage={1000}
                filters={buildFilterString()}
                query=''
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
              <TableHits selectedContractor={contractor.value} />
            </InstantSearch>
          </div>

          {/* Map View */}
          <div className='bg-white rounded-lg shadow-md overflow-hidden z-0 flex-[0.3]'>
            <div className='p-4'>
              <div className='h-[800px] relative w-full'>
                <MapContainer
                  center={initialCenter}
                  zoom={initialZoom}
                  style={{ height: '100%', width: '100%' }}
                  ref={mapRef}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                  />

                  {/* Show project markers */}
                  {mapProjects.map(project => {
                    // Check if we have valid coordinates
                    if (!project.Latitude || !project.Longitude) return null;

                    const lat = parseFloat(project.Latitude);
                    const lng = parseFloat(project.Longitude);

                    // Validate coordinates
                    if (isNaN(lat) || isNaN(lng)) return null;

                    return (
                      <Marker
                        key={project.GlobalID || project.objectID}
                        position={[lat, lng]}
                        icon={L.icon({
                          iconUrl: '/marker-icon-2x.webp',
                          iconSize: [16, 24],
                          iconAnchor: [8, 8],
                          popupAnchor: [0, -25],
                        })}
                      >
                        <Popup>
                          <div className='min-w-[200px]'>
                            <h3 className='font-bold text-gray-900'>
                              {project.ProjectDescription || 'Unnamed Project'}
                            </h3>
                            <p className='text-sm text-gray-800 mt-1'>
                              <strong>Region:</strong> {project.Region || 'N/A'}
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
                              <strong>Type of Work:</strong>{' '}
                              {project.TypeofWork || 'N/A'}
                            </p>
                            <p className='text-sm text-gray-800'>
                              <strong>Cost:</strong> ₱
                              {project.ContractCost
                                ? Number(project.ContractCost).toLocaleString()
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
                <div className='absolute top-4 right-4 z-1000 flex flex-col gap-2'>
                  <Button
                    variant='primary'
                    size='sm'
                    onClick={() => mapRef.current?.zoomIn()}
                    aria-label='Zoom in'
                  >
                    <ZoomIn className='h-4 w-4' />
                  </Button>
                  <Button
                    variant='primary'
                    size='sm'
                    onClick={() => mapRef.current?.zoomOut()}
                    aria-label='Zoom out'
                  >
                    <ZoomOut className='h-4 w-4' />
                  </Button>
                </div>

                {/* Map Info Panel */}
                <div className='absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-3xs z-1000'>
                  <h4 className='font-bold text-gray-900 text-sm mb-1'>
                    {contractorProfile?.company_name ||
                      contractor?.value ||
                      'Contractor'}
                  </h4>
                  <p className='text-xs text-gray-800'>
                    <strong>Total:</strong> {mapProjects.length}
                  </p>
                  <p className='text-xs text-gray-800'>
                    <strong>With Location:</strong>{' '}
                    {mapProjects.filter(p => p.Latitude && p.Longitude).length}
                  </p>
                </div>
              </div>
            </div>
            <InstantSearch
              indexName='bettergov_flood_control'
              searchClient={searchClient}
              future={{ preserveSharedStateOnUnmount: true }}
              key={`search-map-${contractor.value}`}
            >
              <Configure
                hitsPerPage={1000}
                filters={buildFilterString()}
                query=''
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
              <MapHits onHitsUpdate={setMapProjects} />
            </InstantSearch>
          </div>
        </div>

        {/* Data Source Information */}
        <div className='bg-white rounded-lg shadow-md p-4 mt-8'>
          <div className='flex items-start space-x-2'>
            <Info className='w-5 h-5 text-blue-500 mt-0.5' />
            <div>
              <h4 className='text-sm font-medium text-gray-900'>Data Source</h4>
              <p className='text-sm text-gray-800'>
                This data is sourced from the Department of Public Works and
                Highways (DPWH) and represents flood control infrastructure
                projects across the Philippines.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractorDetail;
