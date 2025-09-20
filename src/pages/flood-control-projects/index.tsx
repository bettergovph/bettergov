import React, { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import {
  InstantSearch,
  SearchBox,
  Hits,
  Configure,
  useHits,
} from 'react-instantsearch'
import { instantMeiliSearch } from '@meilisearch/instant-meilisearch'
import 'instantsearch.css/themes/satellite.css'
import { exportMeilisearchData } from '../../lib/exportData'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  Info,
  Download,
  X,
  Users,
  Table,
  Search,
} from 'lucide-react'
import Button from '../../components/ui/Button'

// Import shared components
import {
  FilterDropdown,
  FilterTitle,
  buildFilterString,
  FilterState,
  FloodControlProject,
  FloodControlHit,
} from './shared-components'
import FloodControlProjectsTab from './tab'

// Import lookup data
import infraYearData from '../../data/flood_control/lookups/InfraYear_with_counts.json'
import regionData from '../../data/flood_control/lookups/Region_with_counts.json'
import provinceData from '../../data/flood_control/lookups/Province_with_counts.json'
import deoData from '../../data/flood_control/lookups/DistrictEngineeringOffice_with_counts.json'
import legislativeDistrictData from '../../data/flood_control/lookups/LegislativeDistrict_with_counts.json'
import typeOfWorkData from '../../data/flood_control/lookups/TypeofWork_with_counts.json'
import contractorData from '../../data/flood_control/lookups/Contractor_with_counts.json'

// Meilisearch configuration
const MEILISEARCH_HOST =
  import.meta.env.VITE_MEILISEARCH_HOST || 'http://localhost'
const MEILISEARCH_PORT = import.meta.env.VITE_MEILISEARCH_PORT || '7700'
const MEILISEARCH_SEARCH_API_KEY =
  import.meta.env.VITE_MEILISEARCH_SEARCH_API_KEY ||
  'your_public_search_key_here'

// Create search client with proper type casting
const meiliSearchInstance = instantMeiliSearch(
  `${MEILISEARCH_HOST}:${MEILISEARCH_PORT}`,
  MEILISEARCH_SEARCH_API_KEY,
  {
    primaryKey: 'GlobalID',
    keepZeroFacets: true,
  }
)

// Extract the searchClient from meiliSearchInstance
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const searchClient = meiliSearchInstance.searchClient as any

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
]

interface HitProps {
  hit: FloodControlProject
}

// Hit component for search results
const Hit: React.FC<HitProps> = ({ hit }) => {
  return (
    <div className="p-4 border-b border-gray-200 hover:bg-gray-50">
      <h3 className="text-lg font-semibold text-blue-600">
        {hit.ProjectDescription || 'Flood Control Project'}
      </h3>
      <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
        <div>
          <span className="font-medium">Location:</span>{' '}
          {hit.Municipality && <span>{hit.Municipality}, </span>}
          {hit.Province && <span>{hit.Province}, </span>}
          <span>{hit.Region}</span>
        </div>
        <div>
          <span className="font-medium">Contract ID:</span> {hit.ContractID}
        </div>
        <div>
          <span className="font-medium">Type of Work:</span> {hit.TypeofWork}
        </div>
        <div>
          <span className="font-medium">Contract Cost:</span>{' '}
          {hit.ContractCost
            ? `₱${Number(hit.ContractCost).toLocaleString()}`
            : 'N/A'}
        </div>
      </div>
    </div>
  )
}

// Statistics Display Component with hardcoded values for better performance
const DashboardStatistics: React.FC = () => {
  const { hits, results } = useHits()
  const totalHits = results?.nbHits || 0

  // Default statistics to display when no filters are applied
  const defaultStats = {
    totalProjects: 9855,
    totalCost: 547603497105,
    uniqueContractors: 2409,
  }

  // Check if we're using filters or search
  const isFiltered = totalHits !== 0 && totalHits !== defaultStats.totalProjects

  // If we're filtering, calculate stats dynamically, otherwise use hardcoded values
  const stats = isFiltered
    ? {
        totalProjects: totalHits,
        totalCost: hits.reduce(
          (sum, hit) => sum + (Number(hit.ContractCost) || 0),
          0
        ),
        uniqueContractors: new Set(
          hits.map((hit) => hit.Contractor).filter(Boolean)
        ).size,
      }
    : defaultStats

  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-sm font-medium text-gray-800 mb-1">
            Total Projects
          </h3>
          <p className="text-2xl font-bold text-blue-600">
            {stats.totalProjects.toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-sm font-medium text-gray-800 mb-1">
            Total Contract Cost
          </h3>
          <p className="text-2xl font-bold text-green-600">
            ₱{stats.totalCost.toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-sm font-medium text-gray-800 mb-1">
            Unique Contractors
          </h3>
          <p className="text-2xl font-bold text-purple-600">
            {stats.uniqueContractors.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  )
}

// Chart components that use live filtered data from Meilisearch
const YearlyChart: React.FC = () => {
  const { hits, results } = useHits()
  const totalHits = results?.nbHits || 0
  const typedHits = hits as FloodControlHit[]

  // Check if filters are applied (if total hits is different from default total)
  const isFiltered = totalHits !== 0 && totalHits !== 9855

  // Use pre-loaded data for initial render, switch to dynamic data when filtered
  let chartData

  if (isFiltered) {
    // Create a frequency counter for each year from filtered data
    const yearFrequency: Record<string, number> = {}
    typedHits.forEach((hit) => {
      const year = hit.InfraYear
      if (year) {
        yearFrequency[year] = (yearFrequency[year] || 0) + 1
      }
    })

    // Convert to chart data format and sort by year
    chartData = Object.entries(yearFrequency)
      .map(([name, Projects]) => ({ name, Projects }))
      .sort((a, b) => a.name.localeCompare(b.name))
  } else {
    // Use pre-loaded data for better initial performance
    chartData = infraYearData.InfraYear.sort((a, b) =>
      a.value.localeCompare(b.value)
    ).map((item) => ({
      name: item.value,
      Projects: item.count,
    }))
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fontSize: 9 }} />
        <YAxis tick={{ fontSize: 9 }} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 10 }} />
        <Bar dataKey="Projects" fill="#0088FE" />
      </BarChart>
    </ResponsiveContainer>
  )
}

const RegionChart: React.FC = () => {
  const { hits, results } = useHits()
  const totalHits = results?.nbHits || 0
  const typedHits = hits as FloodControlHit[]

  // Check if filters are applied
  const isFiltered = totalHits !== 0 && totalHits !== 9855

  // Use pre-loaded data for initial render, switch to dynamic data when filtered
  let chartData

  if (isFiltered) {
    // Create a frequency counter for each region
    const regionFrequency: Record<string, number> = {}
    typedHits.forEach((hit) => {
      const region = hit.Region
      if (region && region.trim() !== '') {
        regionFrequency[region] = (regionFrequency[region] || 0) + 1
      }
    })

    // Convert to chart data format, sort by frequency descending, and take top 10
    chartData = Object.entries(regionFrequency)
      .map(([name, Projects]) => ({ name, Projects }))
      .sort((a, b) => b.Projects - a.Projects)
      .slice(0, 10)
  } else {
    // Use pre-loaded data for better initial performance
    chartData = regionData.Region.sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((item) => ({
        name: item.value,
        Projects: item.count,
      }))
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={100}
          fill="#8884d8"
          dataKey="Projects"
          nameKey="name"
          label={({ name }) => name}
        >
          {chartData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value, name) => [`${value} projects`, name]} />
        <Legend wrapperStyle={{ fontSize: 10 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}

const TypeOfWorkChart: React.FC = () => {
  const { hits, results } = useHits()
  const totalHits = results?.nbHits || 0
  const typedHits = hits as FloodControlHit[]

  // Check if filters are applied
  const isFiltered = totalHits !== 0 && totalHits !== 9855

  // Use pre-loaded data for initial render, switch to dynamic data when filtered
  let chartData

  if (isFiltered) {
    // Create a frequency counter for each type of work
    const typeFrequency: Record<string, number> = {}
    typedHits.forEach((hit) => {
      const type = hit.TypeofWork
      if (type && type.trim() !== '') {
        typeFrequency[type] = (typeFrequency[type] || 0) + 1
      }
    })

    // Convert to chart data format, sort by frequency descending, and take top 10
    chartData = Object.entries(typeFrequency)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  } else {
    // Use pre-loaded data for better initial performance
    chartData = typeOfWorkData.TypeofWork.sort(
      (a, b) => b.count - a.count
    ).slice(0, 10)
  }

  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-[60%] pr-2">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={90}
              innerRadius={0}
              fill="#8884d8"
              dataKey="count"
              nameKey="value"
              className='text-xs'
              label={({ value }) => value}
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value, name) => [`${value} projects`, name]} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="w-[40%] max-h-[250px] overflow-y-auto pl-2 pr-4">
        <div className="space-y-2">
          {chartData.map((item, index) => (
            <div key={item.value} className="flex items-center text-xs">
              <div
                className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              ></div>
              <span className="text-gray-700 leading-tight">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const ContractorChart: React.FC = () => {
  const { hits, results } = useHits()
  const totalHits = results?.nbHits || 0
  const typedHits = hits as FloodControlHit[]

  // Check if filters are applied
  const isFiltered = totalHits !== 0 && totalHits !== 9855

  // Use pre-loaded data for initial render, switch to dynamic data when filtered
  let chartData

  if (isFiltered) {
    // Create a frequency counter for each contractor
    const contractorFrequency: Record<string, number> = {}
    typedHits.forEach((hit) => {
      const contractor = hit.Contractor
      if (contractor && contractor.trim() !== '') {
        contractorFrequency[contractor] =
          (contractorFrequency[contractor] || 0) + 1
      }
    })

    // Convert to chart data format, sort by frequency descending, and take top 10
    chartData = Object.entries(contractorFrequency)
      .map(([fullName, Projects]) => ({
        name:
          fullName.length > 30 ? fullName.substring(0, 30) + '...' : fullName,
        Projects,
        fullName,
      }))
      .sort((a, b) => b.Projects - a.Projects)
      .slice(0, 10)
  } else {
    // Use pre-loaded data for better initial performance
    chartData = contractorData.Contractor.sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((item) => ({
        name:
          item.value.length > 30
            ? item.value.substring(0, 30) + '...'
            : item.value,
        Projects: item.count,
        fullName: item.value,
      }))
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 5, right: 30, left: -60, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" tick={{ fontSize: 9 }} />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 7, width: 150 }}
          interval={0}
          width={150}
        />
        <Tooltip
          formatter={(value, name) => [`${value} projects`, name]}
          labelFormatter={(label) => {
            const item = chartData.find((item) => item.name === label)
            return item ? item.fullName : label
          }}
        />
        <Legend wrapperStyle={{ fontSize: 10 }} />
        <Bar dataKey="Projects" fill="#FF8042" />
      </BarChart>
    </ResponsiveContainer>
  )
}

// Removed SearchResultsHits component since we don't need it anymore

const FloodControlProjects: React.FC = () => {
  // State for filters and sidebar visibility
  const [filters, setFilters] = useState<FilterState>({
    InfraYear: '',
    Region: '',
    Province: '',
    TypeofWork: '',
    DistrictEngineeringOffice: '',
    LegislativeDistrict: '',
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [showSidebar, setShowSidebar] = useState(false)

  // Track whether filters or search are applied to conditionally render InstantSearch
  const [filtersApplied, setFiltersApplied] = useState(false)

  // Precalculated chart data for initial load without Meilisearch
  const yearlyChartData = infraYearData.InfraYear.sort((a, b) =>
    a.value.localeCompare(b.value)
  ).map((item) => ({
    name: item.value,
    Projects: item.count,
  }))

  const regionChartData = regionData.Region.sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((item) => ({
      name: item.value,
      Projects: item.count,
    }))

  const typeWorkPieData = typeOfWorkData.TypeofWork.sort(
    (a, b) => b.count - a.count
  )
    .slice(0, 10)
    .map((item) => ({
      value: item.value,
      count: item.count,
    }))

  const contractorChartData = contractorData.Contractor.sort(
    (a, b) => b.count - a.count
  )
    .slice(0, 10)
    .map((item) => ({
      name:
        item.value.length > 30
          ? item.value.substring(0, 30) + '...'
          : item.value,
      Projects: item.count,
      fullName: item.value,
    }))

  // Check if filters or search are applied
  const checkIfFiltersApplied = (
    filters: FilterState,
    searchTerm: string
  ): boolean => {
    // Check if search term is not empty
    if (searchTerm && searchTerm.trim() !== '') return true

    // Check if any filter has a value
    return Object.values(filters).some((value) => value && value.trim() !== '')
  }

  // Handle filter change
  const handleFilterChange = (filterName: keyof FilterState, value: string) => {
    const newFilters = {
      ...filters,
      [filterName]: value,
    }
    setFilters(newFilters)

    // Check if any filters are now applied
    setFiltersApplied(checkIfFiltersApplied(newFilters, searchTerm))
  }

  // Handle search term change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setFiltersApplied(checkIfFiltersApplied(filters, value))
  }
  // Loading state for export
  const [isExporting, setIsExporting] = useState(false)

  // Get the effective search term (no need to include year filter now as it's handled by FundingYear filter)
  const getEffectiveSearchTerm = (): string => {
    // Simply return the searchTerm since we're handling InfraYear via FundingYear filter now
    return searchTerm
  }

  // Export data function
  const handleExportData = async () => {
    // Set loading state
    setIsExporting(true)

    // Build filter string based on selected filters
    const filterString = buildFilterString(filters)
    // Get effective search term
    const effectiveSearchTerm = getEffectiveSearchTerm()

    try {
      await exportMeilisearchData({
        host: MEILISEARCH_HOST,
        port: MEILISEARCH_PORT,
        apiKey: MEILISEARCH_SEARCH_API_KEY,
        indexName: 'bettergov_flood_control',
        filters: filterString,
        searchTerm: effectiveSearchTerm,
        filename: 'flood-control-projects-visual',
      })
      // Show success message
      alert('Data exported successfully!')
    } catch (error) {
      console.error('Error exporting data:', error)
      alert('Failed to export data. Please try again.')
    } finally {
      // Reset loading state
      setIsExporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Flood Control Projects | BetterGov.ph</title>
        <meta
          name="description"
          content="Explore flood control projects across the Philippines"
        />
      </Helmet>

      {/* Main layout with sidebar and content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar for filters - collapsible on mobile */}
          <div
            className={`md:w-64 flex-shrink-0 transition-all duration-300 ${
              showSidebar ? 'block' : 'hidden md:block'
            }`}
          >
            <div className="bg-white rounded-lg shadow-md p-4 sticky top-20">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Filter className="w-5 h-5 text-blue-600 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-800">
                    Filters
                  </h2>
                </div>
                <button
                  className="md:hidden text-gray-800 hover:text-gray-700"
                  onClick={() => setShowSidebar(false)}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Search box in sidebar */}
                <div className="pt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Search Projects
                  </h3>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Projects, contractors, municipality, province, region..."
                      value={searchTerm}
                      onChange={(e) => handleSearchChange(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Infrastructure Year
                  </label>
                  <FilterDropdown
                    name="Year"
                    options={infraYearData.InfraYear}
                    value={filters.InfraYear}
                    onChange={(value) => handleFilterChange('InfraYear', value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Region
                  </label>
                  <FilterDropdown
                    name="Region"
                    options={regionData.Region}
                    value={filters.Region}
                    onChange={(value) => handleFilterChange('Region', value)}
                    searchable
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Province
                  </label>
                  <FilterDropdown
                    name="Province"
                    options={provinceData.Province}
                    value={filters.Province}
                    onChange={(value) => handleFilterChange('Province', value)}
                    searchable
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type of Work
                  </label>
                  <FilterDropdown
                    name="Type of Work"
                    options={typeOfWorkData.TypeofWork}
                    value={filters.TypeofWork}
                    onChange={(value) =>
                      handleFilterChange('TypeofWork', value)
                    }
                    searchable
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    District Engineering Office
                  </label>
                  <FilterDropdown
                    name="DEO"
                    options={deoData.DistrictEngineeringOffice}
                    value={filters.DistrictEngineeringOffice}
                    onChange={(value) =>
                      handleFilterChange('DistrictEngineeringOffice', value)
                    }
                    searchable
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Legislative District
                  </label>
                  <FilterDropdown
                    name="Legislative District"
                    options={legislativeDistrictData.LegislativeDistrict}
                    value={filters.LegislativeDistrict}
                    onChange={(value) =>
                      handleFilterChange('LegislativeDistrict', value)
                    }
                    searchable
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Main content area */}
          <div className="flex-1">
            {/* Mobile toggle for sidebar */}
            <div className="md:hidden mb-4">
              <Button
                variant="outline"
                onClick={() => setShowSidebar(true)}
                leftIcon={<Filter className="w-4 h-4" />}
              >
                Show Filters
              </Button>
            </div>

            {/* Page header */}
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                Flood Control Projects
              </h1>
              <Button
                variant="outline"
                leftIcon={isExporting ? null : <Download className="w-4 h-4" />}
                onClick={handleExportData}
                disabled={isExporting}
              >
                {isExporting ? 'Exporting...' : 'Export Data'}
              </Button>
            </div>

            {/* View Tabs */}
            <FloodControlProjectsTab selectedTab="index" />

            {/* Active Filter Display */}
            <InstantSearch
              indexName="bettergov_flood_control"
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
                  indexName="bettergov_flood_control"
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
                <div className="mb-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg shadow-sm p-4">
                      <h3 className="text-sm font-medium text-gray-800 mb-1">
                        Total Projects
                      </h3>
                      <p className="text-2xl font-bold text-blue-600">9,855</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-4">
                      <h3 className="text-sm font-medium text-gray-800 mb-1">
                        Total Contract Cost
                      </h3>
                      <p className="text-2xl font-bold text-green-600">
                        ₱547,603,497,105
                      </p>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-4">
                      <h3 className="text-sm font-medium text-gray-800 mb-1">
                        Unique Contractors
                      </h3>
                      <p className="text-2xl font-bold text-purple-600">
                        2,409
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </InstantSearch>

            {/* Visualizations Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Projects by Year - Bar Chart */}
              <div className="bg-white rounded-lg shadow-md p-4">
                <div className="flex items-center mb-4">
                  <BarChart3 className="w-5 h-5 text-blue-600 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-800">
                    Projects by Year
                  </h2>
                </div>
                <div className="h-[300px]">
                  {filtersApplied ? (
                    <InstantSearch
                      indexName="bettergov_flood_control"
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
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={yearlyChartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                        <YAxis tick={{ fontSize: 9 }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        <Bar dataKey="Projects" fill="#0088FE" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Top Regions - Pie Chart */}
              <div className="bg-white rounded-lg shadow-md p-4">
                <div className="flex items-center mb-4">
                  <PieChartIcon className="w-5 h-5 text-purple-600 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-800">
                    Top Regions
                  </h2>
                </div>
                <div className="h-[300px]">
                  {filtersApplied ? (
                    <InstantSearch
                      indexName="bettergov_flood_control"
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
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={regionChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="Projects"
                          nameKey="name"
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
                            `${value} projects`,
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
              <div className="bg-white rounded-lg shadow-md p-4">
                <div className="flex items-center mb-4">
                  <PieChartIcon className="w-5 h-5 text-green-600 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-800">
                    Types of Work
                  </h2>
                </div>
                <div className="h-[300px] relative">
                  {filtersApplied ? (
                    <InstantSearch
                      indexName="bettergov_flood_control"
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
                    <div className="flex items-center justify-center h-full">
                      <div className="w-[60%] pr-2">
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie
                              data={typeWorkPieData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={90}
                              innerRadius={0}
                              fill="#8884d8"
                              dataKey="count"
                              nameKey="value"
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
                                `${value} projects`,
                                name,
                              ]}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="w-[40%] max-h-[250px] overflow-y-auto pl-2 pr-4">
                        <div className="space-y-2">
                          {typeWorkPieData.map((item, index) => (
                            <div key={item.value} className="flex items-center text-xs">
                              <div
                                className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              ></div>
                              <span className="text-gray-700 leading-tight">{item.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Top Contractors - Bar Chart */}
              <div className="bg-white rounded-lg shadow-md p-4">
                <div className="flex items-center mb-4">
                  <Users className="w-5 h-5 text-orange-600 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-800">
                    Top Contractors
                  </h2>
                </div>
                <div className="h-[300px]">
                  {filtersApplied ? (
                    <InstantSearch
                      indexName="bettergov_flood_control"
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
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={contractorChartData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: -60, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tick={{ fontSize: 9 }} />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{ fontSize: 7, width: 150 }}
                          interval={0}
                          width={150}
                        />
                        <Tooltip
                          formatter={(value, name) => [
                            `${value} projects`,
                            name,
                          ]}
                          labelFormatter={(label) => {
                            const item = contractorChartData.find(
                              (item) => item.name === label
                            )
                            return item ? item.fullName : label
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        <Bar dataKey="Projects" fill="#FF8042" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            {/* Guidance on Table View */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold text-gray-800">
                  Need Detailed Results?
                </h2>
                <a
                  href="/flood-control-projects/table"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Table className="w-4 h-4 mr-1" />
                  View Table
                </a>
              </div>
              <p className="text-gray-800">
                Visit the Table view for detailed search results, sortable
                columns, and advanced filtering options.
              </p>
            </div>

            {/* Data Source Information */}
            <div className="bg-white rounded-lg shadow-md p-4 mt-8">
              <div className="flex items-center mb-4">
                <Info className="w-5 h-5 text-blue-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-800">
                  About This Data
                </h2>
              </div>
              <p className="text-gray-800 mb-4">
                This dashboard visualizes flood control infrastructure projects
                across the Philippines. The data includes information about
                project locations, types, implementing offices, and more. Use
                the filters in the sidebar to explore specific aspects of the
                data or use the search functionality to find specific projects.
              </p>
              <p className="text-sm text-gray-800">
                Source: https://sumbongsapangulo.ph/flood-control-map/
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FloodControlProjects
