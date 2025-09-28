import React, { useState } from 'react';
import { ChevronLeftIcon } from 'lucide-react';
import { ScrollArea } from '../../components/ui/ScrollArea';
import type { FilterState } from './utils';

// Define types
export interface DataItem {
  value: string;
  count: number;
}

export type FloodControlHit = {
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
  DistrictEngineeringOffice?: string;
  LegislativeDistrict?: string;
};

export type FloodControlProject = {
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
};

export interface HitProps {
  hit: FloodControlProject;
}

// Reusable FilterDropdown component
export interface FilterDropdownProps {
  name: string;
  options: DataItem[];
  value: string;
  onChange: (value: string) => void;
  searchable?: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  name,
  options,
  value,
  onChange,
  searchable = false,
  isOpen,
  onToggle,
}) => {
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
        onClick={onToggle}
      >
        <span className='truncate'>{value ? value : `Select ${name}`}</span>
        <ChevronLeftIcon
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
                  onToggle();
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
                    onToggle();
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

// Dynamic filter title component
export const FilterTitle: React.FC<{
  filters: FilterState;
  searchTerm: string;
}> = ({ filters, searchTerm }) => {
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
  const title =
    activeFilters.length > 0
      ? `Flood Control Projects (${activeFilters.join(', ')})`
      : 'Flood Control Projects';

  return <h1 className='text-2xl font-bold text-gray-900 mb-4'>{title}</h1>;
};

// Statistics component for displaying summary data
export const ResultsStatistics: React.FC<{
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
