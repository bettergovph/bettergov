/**
 * Reverse transformation utilities for exporting CMS data back to JSON format
 * These functions reverse the transformations applied during data migration
 */

/**
 * Official inline export structure
 * Used by directory and LGU exporters
 */
export interface OfficialInline {
  name: string;
  role?: string;
  contact?: string;
  email?: string;
}

/**
 * Maps parent_type collection slugs to their relationship field names
 * on the official-assignments collection
 */
export const PARENT_FIELD_MAP: Record<string, string> = {
  departments: 'department',
  'constitutional-bodies': 'constitutional_body',
  'executive-offices': 'executive_office',
  'department-entities': 'department_entity',
  legislative: 'legislative',
  localities: 'locality',
  'diplomatic-missions': 'diplomatic_mission',
  bureaus: 'bureau',
  'bureau-divisions': 'bureau_division',
  'regional-offices': 'regional_office',
  'attached-agencies': 'attached_agency',
  committees: 'committee',
};

/**
 * Unwraps an array of objects with a single field into an array of values
 *
 * Example:
 * Input: [{requirement: "Valid ID"}, {requirement: "Proof of address"}]
 * Output: ["Valid ID", "Proof of address"]
 *
 * @param arr Array of objects with a single field to unwrap
 * @param fieldName Name of the field to extract
 * @returns Array of unwrapped values
 */
export function unwrapArrayField<T>(
  arr: Array<Record<string, T>> | undefined | null,
  fieldName: string
): T[] {
  if (!arr || arr.length === 0) {
    return [];
  }

  return arr
    .map(item => item[fieldName])
    .filter((value): value is T => value !== undefined && value !== null);
}
