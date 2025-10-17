/**
 * Simple region name mapping for population data lookup
 */

export const REGION_MAPPING = {
  'NATIONAL CAPITAL REGION': 'NCR',
  'CORDILLERA ADMINISTRATIVE REGION': 'CAR',
  ILOCOS: 'REGION I',
  'CAGAYAN VALLEY': 'REGION II',
  'CENTRAL LUZON': 'REGION III',
  CALABARZON: 'REGION IV-A',
  'MIMAROPA REGION': 'MIMAROPA',
  BICOL: 'REGION V',
  'WESTERN VISAYAS': 'REGION VI',
  'CENTRAL VISAYAS': 'REGION VII',
  'EASTERN VISAYAS': 'REGION VIII',
  'ZAMBOANGA PENINSULA': 'REGION IX',
  'NORTHERN MINDANAO': 'REGION X',
  DAVAO: 'REGION XI',
  SOCCSKSARGEN: 'REGION XII',
  CARAGA: 'CARAGA',
  'AUTONOMOUS REGION IN MUSLIM MINDANAO': 'BARMM',
} as const;

/**
 * Resolves region name to population data key
 */
export const resolveRegionPopulationKey = (regionName: string): string => {
  const normalizedName = regionName.toUpperCase().trim();
  return (
    REGION_MAPPING[normalizedName as keyof typeof REGION_MAPPING] ||
    normalizedName
  );
};
