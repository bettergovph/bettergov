import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { InstantSearch, Configure, useHits } from 'react-instantsearch';
import { instantMeiliSearch } from '@meilisearch/instant-meilisearch';
import 'instantsearch.css/themes/satellite.css';
import { exportMeilisearchData } from '../../lib/exportData';
import {
  DownloadIcon,
  ArrowUpDownIcon,
  InfoIcon,
  SearchIcon,
  UsersIcon,
  ExternalLinkIcon,
  ChevronRightIcon,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import { ScrollArea } from '../../components/ui/ScrollArea';

// Import contractor data
import contractorData from '../../data/flood_control/lookups/Contractor_with_counts.json';
import FloodControlProjectsTab from './tab';

// Define types for our data
interface DataItem {
  value: string;
  count: number;
}

// Utility function to create slug from contractor name
const createSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
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

// Define hit component for search results
interface FloodControlProject {
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
  slug?: string;
}

interface HitProps {
  hit: FloodControlProject;
}

// Table Row component
const TableRow: React.FC<HitProps> = ({ hit }) => {
  return (
    <tr className='border-b border-gray-200 hover:bg-gray-50'>
      <td className='px-4 py-3 text-sm'>{hit.ProjectDescription || 'N/A'}</td>
      <td className='px-4 py-3 text-sm'>{hit.InfraYear || 'N/A'}</td>
      <td className='px-4 py-3 text-sm'>{hit.Region || 'N/A'}</td>
      <td className='px-4 py-3 text-sm'>{hit.Province || 'N/A'}</td>
      <td className='px-4 py-3 text-sm'>{hit.Municipality || 'N/A'}</td>
      <td className='px-4 py-3 text-sm'>{hit.TypeofWork || 'N/A'}</td>
      <td className='px-4 py-3 text-sm'>{hit.Contractor || 'N/A'}</td>
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
};

// Statistics component for displaying summary data
const ResultsStatistics: React.FC<{
  hits: FloodControlHit[];
  totalHits: number;
  contractor: string;
  onViewDetails?: () => void;
}> = ({ hits, totalHits, contractor, onViewDetails }) => {
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
    <div className='bg-white p-4 rounded-lg shadow-sm mb-4'>
      <div className='flex justify-between items-center mb-2 py-2'>
        <h2 className='text-lg font-bold text-gray-900'>
          {contractor ? `Projects by ${contractor}` : 'All Projects'}
        </h2>
        {contractor && onViewDetails && (
          <button
            className='text-md bg-blue-600 hover:text-blue-800 text-white flex items-center gap-1 px-3 py-2 rounded-sm hover:bg-blue-50 border border-blue-200'
            onClick={onViewDetails}
            title={`View detailed page for ${contractor}`}
          >
            <span>View More Details</span>
            <ExternalLinkIcon className='w-4 h-4' />
          </button>
        )}
      </div>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <div className='bg-blue-50 p-3 rounded-md'>
          <p className='text-sm text-gray-800'>Total Projects</p>
          <p className='text-2xl font-bold text-blue-700'>
            {totalCount.toLocaleString()}
          </p>
        </div>
        <div className='bg-green-50 p-3 rounded-md'>
          <p className='text-sm text-gray-800'>Total Contract Cost</p>
          <p className='text-2xl font-bold text-green-700'>
            ₱
            {estimatedTotalContractCost.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}
          </p>
        </div>
        <div className='bg-purple-50 p-3 rounded-md'>
          <p className='text-sm text-gray-800'>Average Project Cost</p>
          <p className='text-2xl font-bold text-purple-700'>
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

// Custom Hits component for table view
const TableHits: React.FC<{
  selectedContractor: string;
  onViewDetails?: () => void;
}> = ({ selectedContractor, onViewDetails }) => {
  const [sortField, setSortField] = useState<string>('ProjectDescription');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(0);
  const hitsPerPage = 20; // Number of records per page

  // Use useHits hook from react-instantsearch to access hits data directly
  const { hits, results } = useHits();

  // Sort hits based on current sort field and direction
  const sortedHits = [...hits].sort(
    (a: Record<string, unknown>, b: Record<string, unknown>) => {
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

  const SortHeader: React.FC<{ field: string; label: string }> = ({
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
          <span
            className={`${isActive ? 'text-primary-600' : 'text-gray-800'}`}
          >
            {label}
          </span>
          {isActive ? (
            sortDirection === 'asc' ? (
              <svg
                className='w-3 h-3 ml-1 text-primary-600'
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
                className='w-3 h-3 ml-1 text-primary-600'
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
            <ArrowUpDownIcon className='w-3 h-3 ml-1 text-gray-400' />
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
        onViewDetails={onViewDetails}
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
              <SortHeader field='Contractor' label='Contractor' />
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
                          ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
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

// Contractor item component
interface ContractorItemProps {
  contractor: DataItem;
  isSelected: boolean;
  onClick: () => void;
  onNavigate: (contractorSlug: string) => void;
}

const ContractorItem: React.FC<ContractorItemProps> = ({
  contractor,
  isSelected,
  onClick,
  onNavigate,
}) => (
  <div className='flex'>
    <button
      className={`flex-1 text-left px-3 py-2 text-sm hover:bg-gray-100 ${
        isSelected ? 'bg-primary-50 text-primary-600 font-medium' : ''
      }`}
      onClick={onClick}
      title={contractor.value} // Show full name on hover
    >
      <div className='flex justify-between items-center'>
        <span className='truncate max-w-[180px]'>
          {contractor.value.length > 40
            ? `${contractor.value.substring(0, 40)}...`
            : contractor.value}
        </span>
        <span className='text-gray-800 text-xs ml-2 shrink-0'>
          {contractor.count}
        </span>
      </div>
    </button>
    <button
      className='px-2 py-2 text-xs text-primary-600 hover:text-primary-800 hover:bg-primary-50 shrink-0'
      onClick={() => onNavigate(createSlug(contractor.value))}
      title={`View ${contractor.value} details`}
    >
      <ChevronRightIcon className='h-4 w-4' />
    </button>
  </div>
);

// Main Contractors component
const FloodControlProjectsContractors: React.FC = () => {
  const navigate = useNavigate();
  const [selectedContractor, setSelectedContractor] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Navigation handler for contractor details
  const handleContractorNavigation = (contractorSlug: string) => {
    navigate(`/flood-control-projects/contractors/${contractorSlug}`);
  };

  // Filter contractors based on search term
  const filteredContractors = searchTerm
    ? contractorData.Contractor.filter(contractor =>
        contractor.value.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : contractorData.Contractor;

  // Build filter string for Meilisearch
  const buildFilterString = (): string => {
    const filters = ['type = "flood_control"'];

    // Add contractor filter if one is selected
    if (selectedContractor) {
      filters.push(`Contractor = "${selectedContractor}"`);
    }

    return filters.join(' AND ');
  };

  // Export data function
  const handleExportData = async () => {
    // Set loading state
    setIsExporting(true);

    // Use filter for type and contractor
    const filterString = buildFilterString();
    const searchTerm = selectedContractor || '';

    try {
      await exportMeilisearchData({
        host: MEILISEARCH_HOST,
        port: MEILISEARCH_PORT,
        apiKey: MEILISEARCH_SEARCH_API_KEY,
        indexName: 'bettergov_flood_control',
        filters: filterString,
        searchTerm: searchTerm,
        filename: selectedContractor
          ? `flood-control-projects-${selectedContractor
              .replace(/\s+/g, '-')
              .toLowerCase()}`
          : 'flood-control-projects-contractors',
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

  return (
    <div className='min-h-screen bg-gray-50'>
      <Helmet>
        <title>Flood Control Projects Contractors | BetterGov.ph</title>
        <meta
          name='description'
          content='Explore flood control projects by contractor'
        />
      </Helmet>

      {/* Main layout with sidebar and content */}
      <div className='container mx-auto px-4 py-8'>
        <div className='flex flex-col md:flex-row gap-6'>
          {/* Sidebar with contractors list */}
          <div className='w-full md:w-72 bg-white p-4 rounded-lg shadow-md'>
            <div className='flex items-center justify-between mb-2'>
              <div className='flex items-center'>
                <UsersIcon className='w-5 h-5 text-primary-600 mr-2' />
                <h2 className='text-lg font-semibold text-gray-800'>
                  Contractors
                </h2>
              </div>
            </div>

            {/* Search box in sidebar */}
            <div className='pt-4'>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <SearchIcon className='h-4 w-4 text-gray-400' />
                </div>
                <input
                  type='text'
                  className='block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-hidden focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                  placeholder='Search contractors...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className='mt-4'>
              <ScrollArea className='h-[60vh]'>
                <div className='space-y-1'>
                  <button
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                      !selectedContractor
                        ? 'bg-primary-50 text-primary-600 font-medium'
                        : ''
                    }`}
                    onClick={() => setSelectedContractor('')}
                  >
                    All Contractors
                  </button>

                  {filteredContractors.map(contractor => (
                    <ContractorItem
                      key={contractor.value}
                      contractor={contractor}
                      isSelected={selectedContractor === contractor.value}
                      onClick={() => setSelectedContractor(contractor.value)}
                      onNavigate={handleContractorNavigation}
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Main content area */}
          <div className='flex-1'>
            {/* Mobile toggle for sidebar */}
            <div className='md:hidden mb-4'>
              <Button
                variant='outline'
                onClick={() => {
                  /* Mobile sidebar functionality */
                }}
                leftIcon={<UsersIcon className='w-4 h-4' />}
              >
                Show Contractors
              </Button>
            </div>

            {/* Page header */}
            <div className='flex justify-between items-center mb-6'>
              <h1 className='text-2xl font-bold text-gray-900'>
                Flood Control Projects by Contractor
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
            <FloodControlProjectsTab selectedTab='contractors' />

            {/* Table View */}
            <div className='bg-white rounded-lg shadow-md overflow-hidden'>
              {selectedContractor ? (
                <InstantSearch
                  indexName='bettergov_flood_control'
                  searchClient={searchClient}
                  future={{ preserveSharedStateOnUnmount: true }}
                  key={`search-${selectedContractor}`} // Force re-render when contractor changes
                >
                  <Configure
                    hitsPerPage={1000}
                    filters={buildFilterString()}
                    query=''
                  />
                  <TableHits
                    selectedContractor={selectedContractor}
                    onViewDetails={() =>
                      handleContractorNavigation(createSlug(selectedContractor))
                    }
                  />
                </InstantSearch>
              ) : (
                <div className='p-8 text-center'>
                  <p className='text-lg text-gray-800'>
                    Select a contractor to view their projects
                  </p>
                </div>
              )}
            </div>

            {/* Data Source Information */}
            <div className='bg-white rounded-lg shadow-md p-4 mt-8'>
              <div className='flex items-start space-x-2'>
                <InfoIcon className='w-5 h-5 text-blue-500 mt-0.5' />
                <div>
                  <h4 className='text-sm font-medium text-gray-900'>
                    Data Source
                  </h4>
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
      </div>
    </div>
  );
};

export default FloodControlProjectsContractors;
