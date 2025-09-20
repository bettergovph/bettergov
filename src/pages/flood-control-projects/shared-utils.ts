// Types and utilities for flood control projects
// Separated from shared-components.tsx to avoid React fast-refresh warnings

export interface FilterState {
  InfraYear?: string;
  Region?: string;
  Province?: string;
  DistrictEngineeringOffice?: string;
  LegislativeDistrict?: string;
  TypeofWork?: string;
  Contractor?: string;
}

export interface FloodControlProject {
  type: string;
  FundingYear: number;
  Region: string;
  Province: string;
  DistrictEngineeringOffice: string;
  LegislativeDistrict: string;
  ProjectName: string;
  Location: string;
  TypeofWork: string;
  ProjectCost_PHP: number;
  Contractor: string;
  DateStarted: string;
  TargetDateofCompletion: string;
  Remarks: string;
  Status: string;
  CompletionDate?: string;
  formatted_cost: string;
  DaysOverdue?: number;
  DaysRemaining?: number;
  FundingSource?: string;
  Description?: string;
}

export interface FloodControlHit extends FloodControlProject {
  objectID: string;
  _highlightResult?: Record<string, unknown>;
}

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

  if (filters.TypeofWork && filters.TypeofWork.trim()) {
    filterStrings.push(`TypeofWork = "${filters.TypeofWork.trim()}"`);
  }

  if (filters.Contractor && filters.Contractor.trim()) {
    filterStrings.push(`Contractor = "${filters.Contractor.trim()}"`);
  }

  // Join all filters with AND operator
  return filterStrings.join(' AND ');
};
