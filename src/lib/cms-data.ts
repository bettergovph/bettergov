/**
 * CMS Data Fetching Utilities
 * Fetches CMS-managed JSON data from public/data/ at runtime
 */

const DATA_BASE_URL = '/data';

/**
 * Generic fetch function for JSON data with caching
 */
async function fetchJSON<T>(path: string): Promise<T> {
  const response = await fetch(`${DATA_BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.statusText}`);
  }
  return response.json();
}

// Websites
export async function fetchWebsites() {
  return fetchJSON('/websites.json');
}

// Hotlines
export async function fetchHotlines() {
  return fetchJSON('/philippines_hotlines.json');
}

// Services
export async function fetchServiceCategories() {
  return fetchJSON('/service_categories.json');
}

export async function fetchServicesByCategory(categorySlug: string) {
  return fetchJSON(`/services/${categorySlug}.json`);
}

// Directory - Departments
export async function fetchDepartments() {
  return fetchJSON('/directory/departments.json');
}

// Directory - Executive
export async function fetchExecutive() {
  return fetchJSON('/directory/executive.json');
}

// Directory - Constitutional
export async function fetchConstitutional() {
  return fetchJSON('/directory/constitutional.json');
}

// Directory - Legislative
export async function fetchLegislative() {
  return fetchJSON('/directory/legislative.json');
}

export async function fetchHouseMembers() {
  return fetchJSON('/directory/house_members.json');
}

export async function fetchPartyListReps() {
  return fetchJSON('/directory/party_list_representatives.json');
}

// Directory - Diplomatic
export async function fetchDiplomatic() {
  return fetchJSON('/directory/diplomatic.json');
}

// Directory - LGU
export async function fetchLGUByRegion(regionSlug: string) {
  return fetchJSON(`/directory/lgu/${regionSlug}.json`);
}

// Visa
export async function fetchVisaTypes() {
  return fetchJSON('/visa/philippines_visa_types.json');
}

export async function fetchVisaPolicies() {
  return fetchJSON('/visa/philippines_visa_policy.json');
}
