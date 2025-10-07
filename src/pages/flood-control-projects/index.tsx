import { instantMeiliSearch } from '@meilisearch/instant-meilisearch';
import 'instantsearch.css/themes/satellite.css';
import {
  BarChart3Icon,
  DownloadIcon,
  FilterIcon,
  InfoIcon,
  PieChart as PieChartIcon,
  SearchIcon,
  TableIcon,
  UsersIcon,
  XIcon,
} from 'lucide-react';
import { FC, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Configure, InstantSearch, useHits } from 'react-instantsearch';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Button from '../../components/ui/Button';
import { exportMeilisearchData } from '../../lib/exportData';

// Import shared components
import {
  FilterDropdown,
  FilterTitle,
  // FloodControlProject,
  FloodControlHit,
} from './shared-components';
import FloodControlProjectsTab from './tab';
import { buildFilterString, FilterState } from './utils';

// Import lookup data
import contractorData from '../../data/flood_control/lookups/Contractor_with_counts.json';
import deoData from '../../data/flood_control/lookups/DistrictEngineeringOffice_with_counts.json';
import infraYearData from '../../data/flood_control/lookups/InfraYear_with_counts.json';
import legislativeDistrictData from '../../data/flood_control/lookups/LegislativeDistrict_with_counts.json';
import provinceData from '../../data/flood_control/lookups/Province_with_counts.json';
import regionData from '../../data/flood_control/lookups/Region_with_counts.json';
import typeOfWorkData from '../../data/flood_control/lookups/TypeofWork_with_counts.json';

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

// Colors for charts
const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884D8',
  '#82CA9D',
  '#8DD1E1',
  '#A4DE6C',
  '#D0ED57',
  '#FAAAA3',
];

// Statistics Display Component with hardcoded values for better performance
const DashboardStatistics: FC = () => {
  const { t } = useTranslation('flood-control-projects');
  const { hits, results } = useHits();
  const totalHits = results?.nbHits || 0;

  // Default statistics to display when no filters are applied
  const defaultStats = {
    totalProjects: 9855,
    totalCost: 547603497105,
    uniqueContractors: 2409,
  };

  // Check if we're using filters or search
  const isFiltered =
    totalHits !== 0 && totalHits !== defaultStats.totalProjects;

  // If we're filtering, calculate stats dynamically, otherwise use hardcoded values
  const stats = isFiltered
    ? {
        totalProjects: totalHits,
        totalCost: hits.reduce(
          (sum, hit) => sum + (Number(hit.ContractCost) || 0),
          0
        ),
        uniqueContractors: new Set(
          hits.map(hit => hit.Contractor).filter(Boolean)
        ).size,
      }
    : defaultStats;

  return (
    <div className='mb-6'>
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        <div className='bg-white rounded-lg shadow-xs p-4'>
          <h3 className='text-sm font-medium text-gray-800 mb-1'>
            {t('statistics.totalProjects')}
          </h3>
          <p className='text-2xl font-bold text-blue-600'>
            {stats.totalProjects.toLocaleString()}
          </p>
        </div>

        <div className='bg-white rounded-lg shadow-xs p-4'>
          <h3 className='text-sm font-medium text-gray-800 mb-1'>
            {t('statistics.totalContractCost')}
          </h3>
          <p className='text-2xl font-bold text-green-600'>
            ₱{stats.totalCost.toLocaleString()}
          </p>
        </div>

        <div className='bg-white rounded-lg shadow-xs p-4'>
          <h3 className='text-sm font-medium text-gray-800 mb-1'>
            {t('statistics.uniqueContractors')}
          </h3>
          <p className='text-2xl font-bold text-purple-600'>
            {stats.uniqueContractors.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};

// Chart components that use live filtered data from Meilisearch
const YearlyChart: FC = () => {
  const { hits, results } = useHits();
  const totalHits = results?.nbHits || 0;
  const typedHits = hits as FloodControlHit[];

  // Check if filters are applied (if total hits is different from default total)
  const isFiltered = totalHits !== 0 && totalHits !== 9855;

  // Use pre-loaded data for initial render, switch to dynamic data when filtered
  let chartData;

  if (isFiltered) {
    // Create a frequency counter for each year from filtered data
    const yearFrequency: Record<string, number> = {};
    typedHits.forEach(hit => {
      const year = hit.InfraYear;
      if (year) {
        yearFrequency[year] = (yearFrequency[year] || 0) + 1;
      }
    });

    // Convert to chart data format and sort by year
    chartData = Object.entries(yearFrequency)
      .map(([name, Projects]) => ({ name, Projects }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } else {
    // Use pre-loaded data for better initial performance
    chartData = infraYearData.InfraYear.sort((a, b) =>
      a.value.localeCompare(b.value)
    ).map(item => ({
      name: item.value,
      Projects: item.count,
    }));
  }

  return (
    <ResponsiveContainer width='100%' height='100%'>
      <BarChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray='3 3' />
        <XAxis dataKey='name' tick={{ fontSize: 9 }} />
        <YAxis tick={{ fontSize: 9 }} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 10 }} />
        <Bar dataKey='Projects' fill='#0088FE' />
      </BarChart>
    </ResponsiveContainer>
  );
};

const RegionChart: FC = () => {
  const { t } = useTranslation('flood-control-projects');
  const { hits, results } = useHits();
  const totalHits = results?.nbHits || 0;
  const typedHits = hits as FloodControlHit[];

  // Check if filters are applied
  const isFiltered = totalHits !== 0 && totalHits !== 9855;

  // Use pre-loaded data for initial render, switch to dynamic data when filtered
  let chartData;

  if (isFiltered) {
    // Create a frequency counter for each region
    const regionFrequency: Record<string, number> = {};
    typedHits.forEach(hit => {
      const region = hit.Region;
      if (region && region.trim() !== '') {
        regionFrequency[region] = (regionFrequency[region] || 0) + 1;
      }
    });

    // Convert to chart data format, sort by frequency descending, and take top 10
    chartData = Object.entries(regionFrequency)
      .map(([name, Projects]) => ({ name, Projects }))
      .sort((a, b) => b.Projects - a.Projects)
      .slice(0, 10);
  } else {
    // Use pre-loaded data for better initial performance
    chartData = regionData.Region.sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(item => ({
        name: item.value,
        Projects: item.count,
      }));
  }

  return (
    <ResponsiveContainer width='100%' height='100%'>
      <PieChart>
        <Pie
          data={chartData}
          cx='50%'
          cy='50%'
          labelLine={false}
          outerRadius={100}
          fill='#8884d8'
          dataKey='Projects'
          nameKey='name'
          label={({ name }) => name}
        >
          {chartData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => [
            `${value} ${t('tooltips.projectsFormatter')}`,
            name,
          ]}
        />
        <Legend wrapperStyle={{ fontSize: 10 }} />
      </PieChart>
    </ResponsiveContainer>
  );
};

const TypeOfWorkChart: FC = () => {
  const { t } = useTranslation('flood-control-projects');
  const { hits, results } = useHits();
  const totalHits = results?.nbHits || 0;
  const typedHits = hits as FloodControlHit[];

  // Check if filters are applied
  const isFiltered = totalHits !== 0 && totalHits !== 9855;

  // Use pre-loaded data for initial render, switch to dynamic data when filtered
  let chartData;

  if (isFiltered) {
    // Create a frequency counter for each type of work
    const typeFrequency: Record<string, number> = {};
    typedHits.forEach(hit => {
      const type = hit.TypeofWork;
      if (type && type.trim() !== '') {
        typeFrequency[type] = (typeFrequency[type] || 0) + 1;
      }
    });

    // Convert to chart data format, sort by frequency descending, and take top 10
    chartData = Object.entries(typeFrequency)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  } else {
    // Use pre-loaded data for better initial performance
    chartData = typeOfWorkData.TypeofWork.sort(
      (a, b) => b.count - a.count
    ).slice(0, 10);
  }

  return (
    <div className='flex items-center justify-center h-full'>
      <div className='w-[60%] pr-2'>
        <ResponsiveContainer width='100%' height={250}>
          <PieChart>
            <Pie
              data={chartData}
              cx='50%'
              cy='50%'
              labelLine={false}
              outerRadius={90}
              innerRadius={0}
              fill='#8884d8'
              dataKey='count'
              nameKey='value'
              className='text-xs'
              label={({ value }) => value}
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [
                `${value} ${t('tooltips.projectsFormatter')}`,
                name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className='w-[40%] max-h-[250px] overflow-y-auto pl-2 pr-4'>
        <div className='space-y-2'>
          {chartData.map((item, index) => (
            <div key={item.value} className='flex items-center text-xs'>
              <div
                className='w-3 h-3 rounded-full mr-2 shrink-0'
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              ></div>
              <span className='text-gray-700 leading-tight'>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ContractorChart: FC = () => {
  const { t } = useTranslation('flood-control-projects');
  const { hits, results } = useHits();
  const totalHits = results?.nbHits || 0;
  const typedHits = hits as FloodControlHit[];

  // Check if filters are applied
  const isFiltered = totalHits !== 0 && totalHits !== 9855;

  // Use pre-loaded data for initial render, switch to dynamic data when filtered
  let chartData;

  if (isFiltered) {
    // Create a frequency counter for each contractor
    const contractorFrequency: Record<string, number> = {};
    typedHits.forEach(hit => {
      const contractor = hit.Contractor;
      if (contractor && contractor.trim() !== '') {
        contractorFrequency[contractor] =
          (contractorFrequency[contractor] || 0) + 1;
      }
    });

    // Convert to chart data format, sort by frequency descending, and take top 10
    chartData = Object.entries(contractorFrequency)
      .map(([fullName, Projects]) => ({
        name:
          fullName.length > 30 ? fullName.substring(0, 30) + '...' : fullName,
        Projects,
        fullName,
      }))
      .sort((a, b) => b.Projects - a.Projects)
      .slice(0, 10);
  } else {
    // Use pre-loaded data for better initial performance
    chartData = contractorData.Contractor.sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(item => ({
        name:
          item.value.length > 30
            ? item.value.substring(0, 30) + '...'
            : item.value,
        Projects: item.count,
        fullName: item.value,
      }));
  }

  return (
    <ResponsiveContainer width='100%' height='100%'>
      <BarChart
        data={chartData}
        layout='vertical'
        margin={{ top: 5, right: 30, left: -60, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray='3 3' />
        <XAxis type='number' tick={{ fontSize: 9 }} />
        <YAxis
          type='category'
          dataKey='name'
          tick={{ fontSize: 7, width: 150 }}
          interval={0}
          width={150}
        />
        <Tooltip
          formatter={(value, name) => [
            `${value} ${t('tooltips.projectsFormatter')}`,
            name,
          ]}
          labelFormatter={label => {
            const item = chartData.find(item => item.name === label);
            return item ? item.fullName : label;
          }}
        />
        <Legend wrapperStyle={{ fontSize: 10 }} />
        <Bar dataKey='Projects' fill='#FF8042' />
      </BarChart>
    </ResponsiveContainer>
  );
};

// Removed SearchResultsHits component since we don't need it anymore

const FloodControlProjects: FC = () => {
  const { t } = useTranslation('flood-control-projects');

  // State for filters and sidebar visibility
  const [filters, setFilters] = useState<FilterState>({
    InfraYear: '',
    Region: '',
    Province: '',
    TypeofWork: '',
    DistrictEngineeringOffice: '',
    LegislativeDistrict: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);

  // Track whether filters or search are applied to conditionally render InstantSearch
  const [filtersApplied, setFiltersApplied] = useState(false);

  // State to manage which dropdown is open
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Handle dropdown toggle
  const handleDropdownToggle = (dropdownName: string) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
  };
  // Precalculated chart data for initial load without Meilisearch
  const yearlyChartData = infraYearData.InfraYear.sort((a, b) =>
    a.value.localeCompare(b.value)
  ).map(item => ({
    name: item.value,
    Projects: item.count,
  }));

  const regionChartData = regionData.Region.sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map(item => ({
      name: item.value,
      Projects: item.count,
    }));

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

  const typeWorkPieData = typeOfWorkData.TypeofWork.sort(
    (a, b) => b.count - a.count
  )
    .slice(0, 10)
    .map(item => ({
      value: item.value,
      count: item.count,
    }));

  const contractorChartData = contractorData.Contractor.sort(
    (a, b) => b.count - a.count
  )
    .slice(0, 10)
    .map(item => ({
      name:
        item.value.length > 30
          ? item.value.substring(0, 30) + '...'
          : item.value,
      Projects: item.count,
      fullName: item.value,
    }));

  // Check if filters or search are applied
  const checkIfFiltersApplied = (
    filters: FilterState,
    searchTerm: string
  ): boolean => {
    // Check if search term is not empty
    if (searchTerm && searchTerm.trim() !== '') return true;

    // Check if any filter has a value
    return Object.values(filters).some(value => value && value.trim() !== '');
  };

  // Handle filter change
  const handleFilterChange = (filterName: keyof FilterState, value: string) => {
    const newFilters = {
      ...filters,
      [filterName]: value,
    };

    //reset province when region is changed
    if (filterName === 'Region') {
      newFilters.Province = '';
    }

    setFilters(newFilters);

    // Check if any filters are now applied
    setFiltersApplied(checkIfFiltersApplied(newFilters, searchTerm));
  };

  // Handle search term change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setFiltersApplied(checkIfFiltersApplied(filters, value));
  };
  // Loading state for export
  const [isExporting, setIsExporting] = useState(false);

  // Get the effective search term (no need to include year filter now as it's handled by FundingYear filter)
  const getEffectiveSearchTerm = (): string => {
    // Simply return the searchTerm since we're handling InfraYear via FundingYear filter now
    return searchTerm;
  };

  // Export data function
  const handleExportData = async () => {
    // Set loading state
    setIsExporting(true);

    // Build filter string based on selected filters
    const filterString = buildFilterString(filters);
    // Get effective search term
    const effectiveSearchTerm = getEffectiveSearchTerm();

    try {
      await exportMeilisearchData({
        host: MEILISEARCH_HOST,
        port: MEILISEARCH_PORT,
        apiKey: MEILISEARCH_SEARCH_API_KEY,
        indexName: 'bettergov_flood_control',
        filters: filterString,
        searchTerm: effectiveSearchTerm,
        filename: 'flood-control-projects-visual',
      });
      // Show success message
      alert(t('alerts.exportSuccess'));
    } catch (error) {
      console.error('Error exporting data:', error);
      alert(t('alerts.exportError'));
    } finally {
      // Reset loading state
      setIsExporting(false);
    }
  };

  return (
    <div className='bg-gray-50'>
      <Helmet>
        <title>{t('page.title')}</title>
        <meta name='description' content={t('page.description')} />
      </Helmet>

      {/* Main layout with sidebar and content */}
      <div className='container mx-auto px-4 py-8'>
        <div className='flex flex-col md:flex-row gap-6'>
          {/* Sidebar for filters - collapsible on mobile */}
          <div
            className={`md:w-64 shrink-0 transition-all duration-300 ${
              showSidebar ? 'block' : 'hidden md:block'
            }`}
          >
            <div className='bg-white rounded-lg shadow-md p-4 sticky top-[8.25rem]'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center'>
                  <FilterIcon className='w-5 h-5 text-blue-600 mr-2' />
                  <h2 className='text-lg font-semibold text-gray-800'>
                    {t('filters.title')}
                  </h2>
                </div>
                <button
                  className='md:hidden text-gray-800 hover:text-gray-700'
                  onClick={() => setShowSidebar(false)}
                >
                  <XIcon className='w-5 h-5' />
                </button>
              </div>

              <div className='space-y-4'>
                {/* Search box in sidebar */}
                <div className='pt-4'>
                  <h3 className='text-sm font-medium text-gray-700 mb-2'>
                    {t('filters.searchProjects')}
                  </h3>
                  <div className='relative'>
                    <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                      <SearchIcon className='h-4 w-4 text-gray-400' />
                    </div>
                    <input
                      type='text'
                      className='block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-hidden focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                      placeholder={t('filters.searchPlaceholder')}
                      value={searchTerm}
                      onChange={e => handleSearchChange(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    {t('filters.infrastructureYear')}
                  </label>
                  <FilterDropdown
                    name='Year'
                    options={infraYearData.InfraYear}
                    value={filters.InfraYear}
                    onChange={value => handleFilterChange('InfraYear', value)}
                    isOpen={openDropdown === 'InfraYear'}
                    onToggle={() => handleDropdownToggle('InfraYear')}
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    {t('filters.region')}
                  </label>
                  <FilterDropdown
                    name='Region'
                    options={regionData.Region}
                    value={filters.Region}
                    onChange={value => handleFilterChange('Region', value)}
                    searchable
                    isOpen={openDropdown === 'Region'}
                    onToggle={() => handleDropdownToggle('Region')}
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    {t('filters.province')}
                  </label>
                  <FilterDropdown
                    name='Province'
                    options={provinceOptions}
                    value={filters.Province}
                    onChange={value => handleFilterChange('Province', value)}
                    searchable
                    isOpen={openDropdown === 'Province'}
                    onToggle={() => handleDropdownToggle('Province')}
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    {t('filters.typeOfWork')}
                  </label>
                  <FilterDropdown
                    name='Type of Work'
                    options={typeOfWorkData.TypeofWork}
                    value={filters.TypeofWork}
                    onChange={value => handleFilterChange('TypeofWork', value)}
                    searchable
                    isOpen={openDropdown === 'TypeofWork'}
                    onToggle={() => handleDropdownToggle('TypeofWork')}
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    {t('filters.districtEngineeringOffice')}
                  </label>
                  <FilterDropdown
                    name='DEO'
                    options={deoData.DistrictEngineeringOffice}
                    value={filters.DistrictEngineeringOffice}
                    onChange={value =>
                      handleFilterChange('DistrictEngineeringOffice', value)
                    }
                    searchable
                    isOpen={openDropdown === 'DistrictEngineeringOffice'}
                    onToggle={() =>
                      handleDropdownToggle('DistrictEngineeringOffice')
                    }
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    {t('filters.legislativeDistrict')}
                  </label>
                  <FilterDropdown
                    name='Legislative District'
                    options={legislativeDistrictData.LegislativeDistrict}
                    value={filters.LegislativeDistrict}
                    onChange={value =>
                      handleFilterChange('LegislativeDistrict', value)
                    }
                    searchable
                    isOpen={openDropdown === 'LegislativeDistrict'}
                    onToggle={() => handleDropdownToggle('LegislativeDistrict')}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Main content area */}
          <div className='flex-1'>
            {/* Mobile toggle for sidebar */}
            <div className='md:hidden mb-4'>
              <Button
                variant='outline'
                onClick={() => setShowSidebar(true)}
                leftIcon={<FilterIcon className='w-4 h-4' />}
              >
                {t('filters.showFilters')}
              </Button>
            </div>

            {/* Page header */}
            <div className='flex justify-between items-center mb-6'>
              <h1 className='text-2xl font-bold text-gray-900'>
                {t('page.heading')}
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
                {isExporting ? t('actions.exporting') : t('actions.exportData')}
              </Button>
            </div>

            {/* View Tabs */}
            <FloodControlProjectsTab selectedTab='index' />

            {/* Active Filter Display */}
            <InstantSearch
              indexName='bettergov_flood_control'
              searchClient={searchClient}
              future={{ preserveSharedStateOnUnmount: true }}
            >
              <Configure
                filters={buildFilterString(filters)}
                query={getEffectiveSearchTerm()}
                hitsPerPage={10}
                attributesToRetrieve={[
                  'ProjectDescription',
                  'Municipality',
                  'Province',
                  'Region',
                  'ContractID',
                  'TypeofWork',
                  'ContractCost',
                  'GlobalID',
                  'DistrictEngineeringOffice',
                  'LegislativeDistrict',
                  'Contractor',
                  'InfraYear',
                ]}
              />
              <FilterTitle filters={filters} searchTerm={searchTerm} />

              {/* Statistics */}
              {filtersApplied ? (
                <InstantSearch
                  indexName='bettergov_flood_control'
                  searchClient={searchClient}
                  future={{ preserveSharedStateOnUnmount: true }}
                >
                  <Configure
                    filters={buildFilterString(filters)}
                    query={getEffectiveSearchTerm()}
                    hitsPerPage={10000}
                  />
                  <DashboardStatistics />
                </InstantSearch>
              ) : (
                <div className='mb-6'>
                  <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                    <div className='bg-white rounded-lg shadow-xs p-4'>
                      <h3 className='text-sm font-medium text-gray-800 mb-1'>
                        {t('statistics.totalProjects')}
                      </h3>
                      <p className='text-2xl font-bold text-blue-600'>9,855</p>
                    </div>

                    <div className='bg-white rounded-lg shadow-xs p-4'>
                      <h3 className='text-sm font-medium text-gray-800 mb-1'>
                        {t('statistics.totalContractCost')}
                      </h3>
                      <p className='text-2xl font-bold text-green-600'>
                        ₱547,603,497,105
                      </p>
                    </div>

                    <div className='bg-white rounded-lg shadow-xs p-4'>
                      <h3 className='text-sm font-medium text-gray-800 mb-1'>
                        {t('statistics.uniqueContractors')}
                      </h3>
                      <p className='text-2xl font-bold text-purple-600'>
                        2,409
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </InstantSearch>

            {/* Visualizations Section */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6'>
              {/* Projects by Year - Bar Chart */}
              <div className='bg-white rounded-lg shadow-md p-4'>
                <div className='flex items-center mb-4'>
                  <BarChart3Icon className='w-5 h-5 text-blue-600 mr-2' />
                  <h2 className='text-lg font-semibold text-gray-800'>
                    {t('charts.projectsByYear')}
                  </h2>
                </div>
                <div className='h-[300px]'>
                  {filtersApplied ? (
                    <InstantSearch
                      indexName='bettergov_flood_control'
                      searchClient={searchClient}
                      future={{ preserveSharedStateOnUnmount: true }}
                    >
                      <Configure
                        filters={buildFilterString(filters)}
                        query={getEffectiveSearchTerm()}
                        hitsPerPage={1000}
                      />
                      <YearlyChart />
                    </InstantSearch>
                  ) : (
                    <ResponsiveContainer width='100%' height='100%'>
                      <BarChart
                        data={yearlyChartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray='3 3' />
                        <XAxis dataKey='name' tick={{ fontSize: 9 }} />
                        <YAxis tick={{ fontSize: 9 }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        <Bar dataKey='Projects' fill='#0088FE' />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Top Regions - Pie Chart */}
              <div className='bg-white rounded-lg shadow-md p-4'>
                <div className='flex items-center mb-4'>
                  <PieChartIcon className='w-5 h-5 text-purple-600 mr-2' />
                  <h2 className='text-lg font-semibold text-gray-800'>
                    {t('charts.topRegions')}
                  </h2>
                </div>
                <div className='h-[300px]'>
                  {filtersApplied ? (
                    <InstantSearch
                      indexName='bettergov_flood_control'
                      searchClient={searchClient}
                      future={{ preserveSharedStateOnUnmount: true }}
                    >
                      <Configure
                        filters={buildFilterString(filters)}
                        query={getEffectiveSearchTerm()}
                        hitsPerPage={1000}
                      />
                      <RegionChart />
                    </InstantSearch>
                  ) : (
                    <ResponsiveContainer width='100%' height='100%'>
                      <PieChart>
                        <Pie
                          data={regionChartData}
                          cx='50%'
                          cy='50%'
                          labelLine={false}
                          outerRadius={100}
                          fill='#8884d8'
                          dataKey='Projects'
                          nameKey='name'
                          label={({ name }) => name}
                        >
                          {regionChartData.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name) => [
                            `${value} ${t('tooltips.projectsFormatter')}`,
                            name,
                          ]}
                        />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
              {/* Types of Work - Pie Chart */}
              <div className='bg-white rounded-lg shadow-md p-4'>
                <div className='flex items-center mb-4'>
                  <PieChartIcon className='w-5 h-5 text-green-600 mr-2' />
                  <h2 className='text-lg font-semibold text-gray-800'>
                    {t('charts.typesOfWork')}
                  </h2>
                </div>
                <div className='h-[300px] relative'>
                  {filtersApplied ? (
                    <InstantSearch
                      indexName='bettergov_flood_control'
                      searchClient={searchClient}
                      future={{ preserveSharedStateOnUnmount: true }}
                    >
                      <Configure
                        filters={buildFilterString(filters)}
                        query={getEffectiveSearchTerm()}
                        hitsPerPage={1000}
                      />
                      <TypeOfWorkChart />
                    </InstantSearch>
                  ) : (
                    <div className='flex items-center justify-center h-full'>
                      <div className='w-[60%] pr-2'>
                        <ResponsiveContainer width='100%' height={250}>
                          <PieChart>
                            <Pie
                              data={typeWorkPieData}
                              cx='50%'
                              cy='50%'
                              labelLine={false}
                              outerRadius={90}
                              innerRadius={0}
                              fill='#8884d8'
                              dataKey='count'
                              nameKey='value'
                              className='text-xs'
                              label={({ value }) => value}
                            >
                              {typeWorkPieData.map((_, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value, name) => [
                                `${value} ${t('tooltips.projectsFormatter')}`,
                                name,
                              ]}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className='w-[40%] max-h-[250px] overflow-y-auto pl-2 pr-4'>
                        <div className='space-y-2'>
                          {typeWorkPieData.map((item, index) => (
                            <div
                              key={item.value}
                              className='flex items-center text-xs'
                            >
                              <div
                                className='w-3 h-3 rounded-full mr-2 shrink-0'
                                style={{
                                  backgroundColor:
                                    COLORS[index % COLORS.length],
                                }}
                              ></div>
                              <span className='text-gray-700 leading-tight'>
                                {item.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Top Contractors - Bar Chart */}
              <div className='bg-white rounded-lg shadow-md p-4'>
                <div className='flex items-center mb-4'>
                  <UsersIcon className='w-5 h-5 text-orange-600 mr-2' />
                  <h2 className='text-lg font-semibold text-gray-800'>
                    {t('charts.topContractors')}
                  </h2>
                </div>
                <div className='h-[300px]'>
                  {filtersApplied ? (
                    <InstantSearch
                      indexName='bettergov_flood_control'
                      searchClient={searchClient}
                      future={{ preserveSharedStateOnUnmount: true }}
                    >
                      <Configure
                        filters={buildFilterString(filters)}
                        query={getEffectiveSearchTerm()}
                        hitsPerPage={1000}
                      />
                      <ContractorChart />
                    </InstantSearch>
                  ) : (
                    <ResponsiveContainer width='100%' height='100%'>
                      <BarChart
                        data={contractorChartData}
                        layout='vertical'
                        margin={{ top: 5, right: 30, left: -60, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray='3 3' />
                        <XAxis type='number' tick={{ fontSize: 9 }} />
                        <YAxis
                          type='category'
                          dataKey='name'
                          tick={{ fontSize: 7, width: 150 }}
                          interval={0}
                          width={150}
                        />
                        <Tooltip
                          formatter={(value, name) => [
                            `${value} ${t('tooltips.projectsFormatter')}`,
                            name,
                          ]}
                          labelFormatter={label => {
                            const item = contractorChartData.find(
                              item => item.name === label
                            );
                            return item ? item.fullName : label;
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        <Bar dataKey='Projects' fill='#FF8042' />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            {/* Guidance on Table View */}
            <div className='bg-white rounded-lg shadow-md p-4 mb-6'>
              <div className='flex justify-between items-center mb-2'>
                <h2 className='text-lg font-semibold text-gray-800'>
                  {t('guidance.needDetailedResults')}
                </h2>
                <a
                  href='/flood-control-projects/table'
                  className='inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                >
                  <TableIcon className='w-4 h-4 mr-1' />
                  {t('actions.viewTable')}
                </a>
              </div>
              <p className='text-gray-800'>
                {t('guidance.tableViewDescription')}
              </p>
            </div>

            {/* Data Source Information */}
            <div className='bg-white rounded-lg shadow-md p-4 mt-8'>
              <div className='flex items-center mb-4'>
                <InfoIcon className='w-5 h-5 text-blue-600 mr-2' />
                <h2 className='text-lg font-semibold text-gray-800'>
                  {t('dataSource.title')}
                </h2>
              </div>
              <p className='text-gray-800 mb-4'>
                {t('dataSource.description')}
              </p>
              <p className='text-sm text-gray-800'>
                {t('dataSource.sourceLabel')}{' '}
                <a
                  href='https://sumbongsapangulo.ph/flood-control-map/'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-blue-600 hover:text-blue-800 underline'
                >
                  https://sumbongsapangulo.ph/flood-control-map/
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloodControlProjects;
