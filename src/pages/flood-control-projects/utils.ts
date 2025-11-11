import { FloodYearEnum } from '@/enum/map.enum';
import { FLOOD_YEAR_CONFIG, HAZARD_BASE } from './constants';

// Define types (copied from shared-components.tsx)
export type FilterState = {
  InfraYear: string;
  Region: string;
  Province: string;
  TypeofWork: string;
  DistrictEngineeringOffice: string;
  LegislativeDistrict: string;
};

// Utility function to build filter string
export const buildFilterString = (filters: FilterState): string => {
  // Start with an empty array - we'll add filters as needed
  const filterStrings: string[] = [];

  // Always filter by type
  filterStrings.push('type = "flood_control"');

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

  return filterStrings.join(' AND ');
};

export const mapIdGenerator = () => {
  const generateFloodYearSourceId = (
    year: FloodYearEnum,
    sourceLayer: string
  ) => `flood-${year}-source-${sourceLayer}`;
  const generateFloodYearLayerId = (year: FloodYearEnum, sourceLayer: string) =>
    `flood-${year}-layer-${sourceLayer}`;

  const generateFloodSimulationSourceId = (
    year: FloodYearEnum,
    sourceLayer: string
  ) => `flood-simulation-${year}-source-${sourceLayer}`;
  const generateFloodSimulationLayerId = (
    year: FloodYearEnum,
    sourceLayer: string
  ) => `flood-simulation-${year}-layer-${sourceLayer}`;

  return {
    generateFloodYearSourceId,
    generateFloodYearLayerId,
    generateFloodSimulationSourceId,
    generateFloodSimulationLayerId,
  };
};

export const getExtrusionHeight = ({
  floodDepth,
  floodYear,
  hazardLevel,
}: {
  hazardLevel: number;
  floodDepth: number;
  floodYear: FloodYearEnum;
}) => {
  const base = HAZARD_BASE[hazardLevel]; // relative ground
  const { minDepth, maxDepth } = FLOOD_YEAR_CONFIG[floodYear];

  // Map the current floodDepth into the realistic range for this layer
  // The layer starts appearing when floodDepth >= minDepth
  if (floodDepth < minDepth) return 0;

  // Cap at maxDepth
  const effectiveDepth = Math.min(floodDepth, maxDepth);

  // Relative extrusion height for this hazard layer
  return Math.max(effectiveDepth - base, 0);
};
