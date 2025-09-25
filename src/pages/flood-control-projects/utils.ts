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
