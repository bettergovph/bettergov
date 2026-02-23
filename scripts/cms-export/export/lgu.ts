/**
 * LGU (Local Government Units) exporter
 * Exports regions, provinces, and localities (cities and municipalities) to JSON format
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { PayloadClient } from '../payload-client.js';
import type { OfficialInline } from '../utils/reverse-transformers.js';

/**
 * Locality (city or municipality) export structure
 */
interface LocalityExport {
  city?: string;
  municipality?: string;
  zip_code?: string;
  mayor?: OfficialInline;
  vice_mayor?: OfficialInline;
}

/**
 * Province export structure
 */
interface ProvinceExport {
  province: string;
  cities?: LocalityExport[];
  municipalities?: LocalityExport[];
}

/**
 * Region export structure (for regions with provinces)
 */
interface RegionWithProvincesExport {
  region: string;
  slug: string;
  provinces: ProvinceExport[];
}

/**
 * Region export structure (for NCR - cities directly under region)
 */
interface RegionWithCitiesExport {
  region: string;
  slug: string;
  cities: LocalityExport[];
  municipalities?: LocalityExport[];
}

/**
 * Query official assignments for a locality
 */
/**
 * Build locality officials from pre-fetched assignments
 * Synchronous version that doesn't query the database
 */
function buildLocalityOfficials(assignments: any[]): {
  mayor?: OfficialInline;
  vice_mayor?: OfficialInline;
} {
  const result: { mayor?: OfficialInline; vice_mayor?: OfficialInline } = {};

  for (const assignment of assignments) {
    const official =
      typeof assignment.official === 'object' ? assignment.official : null;
    if (!official) continue;

    const name = [official.first_name, official.last_name]
      .filter(Boolean)
      .join(' ')
      .toUpperCase();

    const inline: OfficialInline = { name };

    // Add contact and email if available (from official, not assignment)
    if (official.contact) inline.contact = official.contact;
    if (official.email) inline.email = official.email;

    // Map by context
    if (assignment.context === 'mayor') {
      result.mayor = inline;
    } else if (assignment.context === 'vice_mayor') {
      result.vice_mayor = inline;
    }
  }

  return result;
}

/**
 * Convert locality document to export format
 */
function localityToExport(
  doc: any,
  localityType: 'city' | 'municipality',
  assignmentsByLocality: Map<number, any[]>
): LocalityExport {
  const locality: LocalityExport = {};

  // Set city or municipality field
  if (localityType === 'city') {
    locality.city = doc.locality_name;
  } else {
    locality.municipality = doc.locality_name;
  }

  // Add zip code if available
  if (doc.zip_code) {
    locality.zip_code = doc.zip_code;
  }

  // Get pre-fetched officials
  const assignments = assignmentsByLocality.get(Number(doc.id)) || [];
  const officials = buildLocalityOfficials(assignments);
  if (officials.mayor) locality.mayor = officials.mayor;
  if (officials.vice_mayor) locality.vice_mayor = officials.vice_mayor;

  return locality;
}

/**
 * Export a single region with all its provinces and localities
 */
async function exportRegion(
  payload: PayloadClient,
  regionDoc: any,
  assignmentsByLocality: Map<number, any[]>
): Promise<RegionWithProvincesExport | RegionWithCitiesExport> {
  console.log(`  Processing region: ${regionDoc.region_name}`);

  // Fetch all provinces for this region
  const provincesResult = await payload.find({
    collection: 'provinces',
    where: {
      region: { equals: regionDoc.id },
    },
    limit: 1000,
    sort: 'province_name',
  });

  console.log(`    Found ${provincesResult.docs.length} provinces`);

  // Check if this is NCR or a region with a placeholder province
  // (where province slug matches region slug, indicating cities are directly under region)
  const isNCR =
    regionDoc.region_code === 'NCR' ||
    regionDoc.region_name.toUpperCase().includes('NATIONAL CAPITAL');

  const hasPlaceholderProvince =
    provincesResult.docs.length === 1 &&
    provincesResult.docs[0].slug === regionDoc.slug;

  // If NCR or region with placeholder province, export cities directly under region
  if (isNCR || hasPlaceholderProvince) {
    console.log(`    Special case: Region with cities directly (e.g., NCR)`);

    // Fetch localities from the placeholder province
    const placeholderProvince =
      provincesResult.docs.length > 0 ? provincesResult.docs[0] : null;

    let regionLocalities: any[] = [];

    if (placeholderProvince) {
      // Fetch localities from the placeholder province
      const localitiesResult = await payload.find({
        collection: 'localities',
        where: {
          province: { equals: placeholderProvince.id },
        },
        limit: 1000,
        sort: 'locality_name',
      });
      regionLocalities = localitiesResult.docs;
    } else {
      // Fallback: fetch all and filter
      const localitiesResult = await payload.find({
        collection: 'localities',
        where: {},
        limit: 1000,
        depth: 1,
        sort: 'locality_name',
      });

      regionLocalities = localitiesResult.docs.filter(loc => {
        const province = typeof loc.province === 'object' ? loc.province : null;
        return province && province.region === regionDoc.id;
      });
    }

    console.log(`    Found ${regionLocalities.length} localities for NCR`);

    // Separate cities and municipalities
    const cities: LocalityExport[] = [];
    const municipalities: LocalityExport[] = [];

    for (const localityDoc of regionLocalities) {
      const locality = localityToExport(
        localityDoc,
        localityDoc.locality_type,
        assignmentsByLocality
      );

      if (localityDoc.locality_type === 'city') {
        cities.push(locality);
      } else {
        municipalities.push(locality);
      }
    }

    const result: RegionWithCitiesExport = {
      region: regionDoc.region_name,
      slug: regionDoc.slug,
      cities,
    };

    if (municipalities.length > 0) {
      result.municipalities = municipalities;
    }

    return result;
  }

  // Regular region with provinces
  const provinces: ProvinceExport[] = [];

  for (const provinceDoc of provincesResult.docs) {
    console.log(`      Processing province: ${provinceDoc.province_name}`);

    // Fetch all localities for this province
    const localitiesResult = await payload.find({
      collection: 'localities',
      where: {
        province: { equals: provinceDoc.id },
      },
      limit: 1000,
      sort: 'locality_name',
    });

    console.log(
      `        Found ${localitiesResult.docs.length} localities (${localitiesResult.docs.filter(l => l.locality_type === 'city').length} cities, ${localitiesResult.docs.filter(l => l.locality_type === 'municipality').length} municipalities)`
    );

    // Separate cities and municipalities
    const cities: LocalityExport[] = [];
    const municipalities: LocalityExport[] = [];

    for (const localityDoc of localitiesResult.docs) {
      const locality = localityToExport(
        localityDoc,
        localityDoc.locality_type,
        assignmentsByLocality
      );

      if (localityDoc.locality_type === 'city') {
        cities.push(locality);
      } else {
        municipalities.push(locality);
      }
    }

    // Build province object
    const province: ProvinceExport = {
      province: provinceDoc.province_name,
    };

    // Only add cities/municipalities arrays if they exist
    if (cities.length > 0) {
      province.cities = cities;
    }
    if (municipalities.length > 0) {
      province.municipalities = municipalities;
    }

    provinces.push(province);
  }

  return {
    region: regionDoc.region_name,
    slug: regionDoc.slug,
    provinces,
  };
}

/**
 * Export all LGU data organized by region
 */
export async function exportLGU(
  payload: PayloadClient
): Promise<Record<string, RegionWithProvincesExport | RegionWithCitiesExport>> {
  console.log('📦 Exporting LGU data...');

  // Fetch all regions
  const regionsResult = await payload.find({
    collection: 'regions',
    limit: 100,
    sort: 'region_name',
  });

  console.log(`   Found ${regionsResult.docs.length} regions`);

  // Bulk-fetch all locality assignments in one query to avoid N+1
  const assignmentsResult = await payload.find({
    collection: 'official-assignments',
    where: { parent_type: { equals: 'localities' } },
    depth: 2,
    limit: 10000,
  });

  // Group assignments by locality ID
  const assignmentsByLocality = new Map<number, any[]>();
  for (const assignment of assignmentsResult.docs) {
    if (!assignment.locality) continue;
    const localityId =
      typeof assignment.locality === 'object'
        ? assignment.locality.id
        : assignment.locality;
    if (localityId == null) continue;
    const numericId = Number(localityId);
    if (!assignmentsByLocality.has(numericId)) {
      assignmentsByLocality.set(numericId, []);
    }
    assignmentsByLocality.get(numericId)!.push(assignment);
  }

  const regionData: Record<
    string,
    RegionWithProvincesExport | RegionWithCitiesExport
  > = {};

  for (const regionDoc of regionsResult.docs) {
    const regionExport = await exportRegion(
      payload,
      regionDoc,
      assignmentsByLocality
    );

    // Use slug as the key for the output filename
    regionData[regionDoc.slug] = regionExport;
  }

  console.log(`✅ Exported ${regionsResult.docs.length} regions`);
  return regionData;
}
