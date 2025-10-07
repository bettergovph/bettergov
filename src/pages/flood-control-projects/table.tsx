import { FC, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { InstantSearch, Configure, useHits } from 'react-instantsearch';
import { instantMeiliSearch } from '@meilisearch/instant-meilisearch';
import 'instantsearch.css/themes/satellite.css';
import { exportMeilisearchData } from '../../lib/exportData';
import {
  Filter,
  ChevronLeft,
  Download,
  ArrowUpDown,
  Info,
  Search,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import { ScrollArea } from '../../components/ui/ScrollArea';
import FloodControlProjectsTab from './tab';

// Import lookup data
import infraYearData from '../../data/flood_control/lookups/InfraYear_with_counts.json';
import regionData from '../../data/flood_control/lookups/Region_with_counts.json';
import provinceData from '../../data/flood_control/lookups/Province_with_counts.json';
import deoData from '../../data/flood_control/lookups/DistrictEngineeringOffice_with_counts.json';
import legislativeDistrictData from '../../data/flood_control/lookups/LegislativeDistrict_with_counts.json';
import typeOfWorkData from '../../data/flood_control/lookups/TypeofWork_with_counts.json';

// Define types for our data
interface DataItem {
  value: string;
  count: number;
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

// Extract the searchClient from meiliSearchInstance
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const searchClient = meiliSearchInstance.searchClient as any;

// Define filter dropdown component props
interface FilterDropdownProps {
  name: string;
  options: DataItem[];
  value: string;
  onChange: (value: string) => void;
  searchable?: boolean;
}

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
  // Add other specific properties as needed
}

interface HitProps {
  hit: FloodControlProject;
}

// Filter dropdown component with search capability
const FilterDropdown: FC<FilterDropdownProps> = ({
  name,
  options,
  value,
  onChange,
  searchable = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOptions =
    searchable && searchTerm
      ? options.filter(option =>
          option.value.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : options;

  return (
    <div className='relative'>
      <button
        type='button'
        className='w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white text-sm'
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className='truncate'>{value ? value : `Select ${name}`}</span>
        <ChevronLeft
          className={`w-4 h-4 ml-2 transform ${
            isOpen ? 'rotate-90' : '-rotate-90'
          }`}
        />
      </button>

      {isOpen && (
        <div className='absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg'>
          {searchable && (
            <div className='p-2 border-b border-gray-200'>
              <input
                type='text'
                className='w-full px-2 py-1 text-sm border border-gray-300 rounded-md'
                placeholder='Search...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          )}

          <ScrollArea className='max-h-60'>
            <div className='py-1'>
              <button
                type='button'
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                  !value ? 'bg-blue-50 text-blue-600' : ''
                }`}
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
              >
                All
              </button>

              {filteredOptions.map(option => (
                <button
                  key={option.value}
                  type='button'
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                    value === option.value ? 'bg-blue-50 text-blue-600' : ''
                  }`}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                >
                  <div className='flex justify-between items-center'>
                    <span className='truncate'>{option.value}</span>
                    <span className='text-gray-800 text-xs'>
                      {option.count}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

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

// Define filters type
type FilterState = {
  InfraYear: string;
  Region: string;
  Province: string;
  TypeofWork: string;
  DistrictEngineeringOffice: string;
  LegislativeDistrict: string;
  [key: string]: string;
};

// Dynamic filter title component
const FilterTitle: FC<{ filters: FilterState; searchTerm: string }> = ({
  filters,
  searchTerm,
}) => {
  // Create an array of active filter descriptions
  const activeFilters: string[] = [];

  if (searchTerm) {
    activeFilters.push(`Search: "${searchTerm}"`);
  }

  if (filters.InfraYear) {
    activeFilters.push(`Year: ${filters.InfraYear}`);
  }

  if (filters.Region) {
    activeFilters.push(`Region: ${filters.Region}`);
  }

  if (filters.Province) {
    activeFilters.push(`Province: ${filters.Province}`);
  }

  if (filters.TypeofWork) {
    activeFilters.push(`Type of Work: ${filters.TypeofWork}`);
  }

  if (filters.DistrictEngineeringOffice) {
    activeFilters.push(
      `District Engineering Office: ${filters.DistrictEngineeringOffice}`
    );
  }

  if (filters.LegislativeDistrict) {
    activeFilters.push(`Legislative District: ${filters.LegislativeDistrict}`);
  }

  // Generate title
  let title = 'All Flood Control Projects';

  if (activeFilters.length > 0) {
    title = `Flood Control Projects | ${activeFilters.join(' | ')}`;
  }

  return (
    <div className='p-6'>
      <h2 className='text-xl font-bold text-gray-800'>{title}</h2>
      {activeFilters.length > 0 && (
        <div className='mt-2 flex flex-wrap gap-2'>
          {activeFilters.map((filter, index) => (
            <span
              key={index}
              className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800'
            >
              {filter}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// Statistics component for displaying summary data
const ResultsStatistics: FC<{
  hits: FloodControlHit[];
  totalHits: number;
}> = ({ hits, totalHits }) => {
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

  // Get unique contractors count
  const uniqueContractors = new Set(
    hits
      .filter(hit => hit.Contractor && hit.Contractor.trim() !== '')
      .map(hit => hit.Contractor)
  ).size;

  return (
    <div className='bg-white p-4 rounded-lg shadow-sm mb-4'>
      <h3 className='text-lg font-medium text-gray-900 mb-2'>
        Project Statistics
      </h3>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <div className='bg-blue-50 p-3 rounded-md'>
          <p className='text-sm text-gray-800'>Total Projects</p>
          <p className='text-2xl font-bold text-blue-700'>
            {totalCount.toLocaleString()}
          </p>
        </div>
        <div className='bg-green-50 p-3 rounded-md'>
          <p className='text-sm text-gray-800'>Estimated Total Contract Cost</p>
          <p className='text-2xl font-bold text-green-700'>
            ₱
            {estimatedTotalContractCost.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}
          </p>
          <p className='text-xs text-gray-800 mt-1'>
            Based on average project cost
          </p>
        </div>
        <div className='bg-purple-50 p-3 rounded-md'>
          <p className='text-sm text-gray-800'>Unique Contractors</p>
          <p className='text-2xl font-bold text-purple-700'>
            {uniqueContractors.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};

// Custom Hits component for table view
const TableHits: FC<{ filters: FilterState; searchTerm: string }> = ({
  filters,
  searchTerm,
}) => {
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
      {/* Add the filter title component */}
      <FilterTitle filters={filters} searchTerm={searchTerm} />

      {/* Add the statistics component */}
      <ResultsStatistics
        totalHits={results?.nbHits || 0}
        hits={hits as FloodControlHit[]}
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

const FloodControlProjectsTable: FC = () => {
  // State for filters and search
  const [filters, setFilters] = useState<FilterState>({
    InfraYear: '',
    Region: '',
    Province: '',
    TypeofWork: '',
    DistrictEngineeringOffice: '',
    LegislativeDistrict: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Handle filter change
  const handleFilterChange = (filterName: string, value: string) => {
    const newFilters = {
      ...filters,
      [filterName]: value,
    };

    //reset province when region is changed
    if (filterName === 'Region') {
      newFilters.Province = '';
    }

    setFilters(newFilters);
  };

  // Build filter string for Meilisearch
  const buildFilterString = (): string => {
    // Start with an empty array - we'll add filters as needed
    const filterStrings: string[] = [];

    // Based on the error message, these are the only filterable attributes:
    // CompletionDateActual, DistrictEngineeringOffice, FundingYear, GlobalID,
    // LegislativeDistrict, Municipality, Province, Region, StartDate, TypeofWork, type

    // Always filter by type - format it correctly
    filterStrings.push('type = "flood_control"');

    // InfraYear is not filterable, try using FundingYear instead if they represent the same data
    if (filters.InfraYear && filters.InfraYear.trim()) {
      filterStrings.push(`FundingYear = ${filters.InfraYear.trim()}`);
    }

    if (filters.Region && filters.Region.trim()) {
      filterStrings.push(`Region = "${filters.Region.trim()}"`);
    }

    if (filters.Province && filters.Province.trim()) {
      filterStrings.push(`Province = "${filters.Province.trim()}"`);
    }

    if (filters.TypeofWork && filters.TypeofWork.trim()) {
      filterStrings.push(`TypeofWork = "${filters.TypeofWork.trim()}"`);
    }

    if (
      filters.DistrictEngineeringOffice &&
      filters.DistrictEngineeringOffice.trim()
    ) {
      filterStrings.push(
        `DistrictEngineeringOffice = "${filters.DistrictEngineeringOffice.trim()}"`
      );
    }

    if (filters.LegislativeDistrict && filters.LegislativeDistrict.trim()) {
      filterStrings.push(
        `LegislativeDistrict = "${filters.LegislativeDistrict.trim()}"`
      );
    }

    return filterStrings.length > 0 ? filterStrings.join(' AND ') : '';
  };

  const provinceOptions = useMemo(() => {
    if (filters.Region === 'National Capital Region') {
      const nationalCapitalRegion = provinceData.Province.filter(
        item => item.regCode === '13'
      );
      const otherRegions = provinceData.Province.filter(item => !item.regCode);
      return [...nationalCapitalRegion, ...otherRegions];
    }

    if (filters.Region) {
      const regionId = regionData.Region.find(
        item => item.value === filters.Region
      )?.regCode;
      return provinceData.Province.filter(item => item.regCode === regionId);
    }

    return provinceData.Province;
  }, [filters.Region]);

  // Export data function
  const handleExportData = async () => {
    // Set loading state
    setIsExporting(true);

    // Build filter string based on selected filters
    const filterString = buildFilterString();
    // Get effective search term including year filter if present
    const effectiveSearchTerm = getEffectiveSearchTerm();

    try {
      await exportMeilisearchData({
        host: MEILISEARCH_HOST,
        port: MEILISEARCH_PORT,
        apiKey: MEILISEARCH_SEARCH_API_KEY,
        indexName: 'bettergov_flood_control',
        filters: filterString,
        searchTerm: effectiveSearchTerm,
        filename: 'flood-control-projects-table',
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

  // Update search term when it changes in the search box
  const handleSearchChange = (query: string) => {
    setSearchTerm(query);
  };

  // Get the effective search term (no need to include year filter now as it's handled by FundingYear filter)
  const getEffectiveSearchTerm = (): string => {
    // Simply return the searchTerm since we're handling InfraYear via FundingYear filter now
    return searchTerm;
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      <Helmet>
        <title>Flood Control Projects Table | BetterGov.ph</title>
        <meta
          name='description'
          content='Explore flood control projects data in tabular format'
        />
      </Helmet>

      {/* Main layout with sidebar and content */}
      <div className='container mx-auto px-4 py-8'>
        <div className='flex flex-col md:flex-row gap-6'>
          {/* Sidebar with filters */}
          <div className='w-full md:w-72 bg-white p-4 rounded-lg shadow-md'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center'>
                <Filter className='w-5 h-5 text-blue-600 mr-2' />
                <h2 className='text-lg font-semibold text-gray-800'>Filters</h2>
              </div>
            </div>

            <div className='space-y-4'>
              {/* Search box in sidebar */}
              <div className='pt-4'>
                <h3 className='text-sm font-medium text-gray-700 mb-2'>
                  Search Projects
                </h3>
                <div className='relative'>
                  <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                    <Search className='h-4 w-4 text-gray-400' />
                  </div>
                  <input
                    type='text'
                    className='block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-hidden focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                    placeholder='Projects, contractors, municipality, province, region...'
                    value={searchTerm}
                    onChange={e => handleSearchChange(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Year
                </label>
                <FilterDropdown
                  name='Year'
                  options={infraYearData.InfraYear}
                  value={filters.InfraYear}
                  onChange={value => handleFilterChange('InfraYear', value)}
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Region
                </label>
                <FilterDropdown
                  name='Region'
                  options={regionData.Region}
                  value={filters.Region}
                  onChange={value => handleFilterChange('Region', value)}
                  searchable
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Province
                </label>
                <FilterDropdown
                  name='Province'
                  options={provinceOptions}
                  value={filters.Province}
                  onChange={value => handleFilterChange('Province', value)}
                  searchable
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Type of Work
                </label>
                <FilterDropdown
                  name='Type of Work'
                  options={typeOfWorkData.TypeofWork}
                  value={filters.TypeofWork}
                  onChange={value => handleFilterChange('TypeofWork', value)}
                  searchable
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  District Engineering Office
                </label>
                <FilterDropdown
                  name='DEO'
                  options={deoData.DistrictEngineeringOffice}
                  value={filters.DistrictEngineeringOffice}
                  onChange={value =>
                    handleFilterChange('DistrictEngineeringOffice', value)
                  }
                  searchable
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Legislative District
                </label>
                <FilterDropdown
                  name='Legislative District'
                  options={legislativeDistrictData.LegislativeDistrict}
                  value={filters.LegislativeDistrict}
                  onChange={value =>
                    handleFilterChange('LegislativeDistrict', value)
                  }
                  searchable
                />
              </div>
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
                leftIcon={<Filter className='w-4 h-4' />}
              >
                Show Filters
              </Button>
            </div>

            {/* Page header */}
            <div className='flex justify-between items-center mb-6'>
              <h1 className='text-2xl font-bold text-gray-900'>
                Flood Control Projects Table View
              </h1>
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

            {/* View Tabs */}
            <FloodControlProjectsTab selectedTab='table' />

            {/* Table View */}
            <div className='bg-white rounded-lg shadow-md overflow-hidden'>
              <InstantSearch
                indexName='bettergov_flood_control'
                searchClient={searchClient}
                future={{ preserveSharedStateOnUnmount: true }}
              >
                <Configure
                  hitsPerPage={1000}
                  filters={buildFilterString()}
                  query={getEffectiveSearchTerm()}
                />
                <TableHits filters={filters} searchTerm={searchTerm} />
              </InstantSearch>
            </div>

            {/* Data Source Information */}
            <div className='bg-white rounded-lg shadow-md p-4 mt-8'>
              <div className='flex items-center mb-4'>
                <Info className='w-5 h-5 text-blue-600 mr-2' />
                <h2 className='text-lg font-semibold text-gray-800'>
                  About This Data
                </h2>
              </div>
              <p className='text-gray-800 mb-4'>
                This table displays flood control infrastructure projects across
                the Philippines. Use the filters in the sidebar to narrow down
                specific projects, or use the search functionality to find
                projects by keyword. You can sort the table by clicking on any
                column header.
              </p>
              <p className='text-sm text-gray-800'>
                Source: https://sumbongsapangulo.ph/flood-control-map/
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloodControlProjectsTable;
