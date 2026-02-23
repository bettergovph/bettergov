/**
 * Websites exporter
 * Exports websites collection to JSON format
 */

import type { PayloadClient } from '../payload-client.js';

export interface WebsiteExport {
  name: string;
  slug: string;
  type: string;
  website?: string;
  email?: string;
  address?: string;
  contact?: string;
  parent_department?: string;
}

/**
 * Export websites from CMS to JSON format
 *
 * @param payload Payload instance
 * @returns Array of website objects in source format
 */
export async function exportWebsites(
  payload: PayloadClient
): Promise<WebsiteExport[]> {
  console.log('📦 Exporting websites...');

  // Fetch all websites
  const result = await payload.find({
    collection: 'websites',
    limit: 10000, // Fetch all (adjust if needed)
    sort: 'name',
  });

  console.log(`   Found ${result.docs.length} websites`);

  // Transform to source format
  const websites: WebsiteExport[] = result.docs.map(doc => {
    const website: WebsiteExport = {
      name: doc.name,
      slug: doc.slug,
      type: doc.type,
    };

    // Add optional fields only if they exist
    if (doc.website) website.website = doc.website;
    if (doc.email) website.email = doc.email;
    if (doc.address) website.address = doc.address;
    if (doc.contact) website.contact = doc.contact;
    if (doc.parent_department)
      website.parent_department = doc.parent_department;

    return website;
  });

  console.log(`✅ Exported ${websites.length} websites`);
  return websites;
}
