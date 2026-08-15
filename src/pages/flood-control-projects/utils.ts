// Define types (copied from shared-components.tsx)
export type FilterState = {
  InfraYear: string;
  Region: string;
  Province: string;
  TypeofWork: string;
  DistrictEngineeringOffice: string;
  LegislativeDistrict: string;
};

/**
 * Escapes a value before it is interpolated into a Meilisearch filter
 * expression.
 *
 * Filter values reach us from URL query parameters, so a value containing a
 * double quote would otherwise close the quoted string early and let the rest
 * of the value be parsed as filter syntax. Backslashes are escaped first so
 * that the ones added for quotes are not escaped a second time.
 */
export const escapeFilterValue = (value: string): string =>
  value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

/**
 * Builds a `field = "value"` equality term with the value safely escaped.
 */
export const buildEqualityFilter = (field: string, value: string): string =>
  `${field} = "${escapeFilterValue(value)}"`;

// Utility function to build filter string
export const buildFilterString = (filters: FilterState): string => {
  // Start with an empty array - we'll add filters as needed
  const filterStrings: string[] = [];

  // Always filter by type
  filterStrings.push('type = "flood_control"');

  // FundingYear is numeric, so it is compared unquoted. Only emit the term
  // when the value really is a year, otherwise an arbitrary string would be
  // interpolated straight into the expression as filter syntax.
  const infraYear = filters.InfraYear?.trim();
  if (infraYear && /^\d{4}$/.test(infraYear)) {
    filterStrings.push(`FundingYear = ${infraYear}`);
  }

  if (filters.Region && filters.Region.trim()) {
    filterStrings.push(buildEqualityFilter('Region', filters.Region.trim()));
  }

  if (filters.Province && filters.Province.trim()) {
    filterStrings.push(
      buildEqualityFilter('Province', filters.Province.trim())
    );
  }

  if (filters.TypeofWork && filters.TypeofWork.trim()) {
    filterStrings.push(
      buildEqualityFilter('TypeofWork', filters.TypeofWork.trim())
    );
  }

  if (
    filters.DistrictEngineeringOffice &&
    filters.DistrictEngineeringOffice.trim()
  ) {
    filterStrings.push(
      buildEqualityFilter(
        'DistrictEngineeringOffice',
        filters.DistrictEngineeringOffice.trim()
      )
    );
  }

  if (filters.LegislativeDistrict && filters.LegislativeDistrict.trim()) {
    filterStrings.push(
      buildEqualityFilter(
        'LegislativeDistrict',
        filters.LegislativeDistrict.trim()
      )
    );
  }

  return filterStrings.join(' AND ');
};

export const generateUrlParams = (newFilters: FilterState): URLSearchParams => {
  const keyMap: Record<keyof FilterState, string> = {
    InfraYear: 'year',
    Region: 'region',
    Province: 'province',
    TypeofWork: 'typeOfWork',
    DistrictEngineeringOffice: 'deo',
    LegislativeDistrict: 'district',
  };

  const newParams = new URLSearchParams();
  (Object.keys(newFilters) as Array<keyof FilterState>).forEach(key => {
    const urlKey = keyMap[key];
    const filterValue = newFilters[key];

    // Only set the parameter if the value is not an empty string
    if (filterValue) {
      newParams.set(urlKey, filterValue);
    }
  });

  return newParams;
};
