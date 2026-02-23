/**
 * Hotlines exporter
 * Exports hotlines collection to JSON format grouped by category
 */

import type { PayloadClient } from '../payload-client.js';
import { unwrapArrayField } from '../utils/reverse-transformers.js';

export interface HotlineExport {
  name: string;
  category: string;
  numbers: string[];
  description: string;
}

export interface HotlinesExport {
  emergencyHotlines: HotlineExport[];
  disasterHotlines: HotlineExport[];
  securityHotlines: HotlineExport[];
  transportHotlines: HotlineExport[];
  weatherHotlines: HotlineExport[];
  utilityHotlines: HotlineExport[];
  socialServicesHotlines: HotlineExport[];
  criticalHotlines: HotlineExport[];
}

/**
 * Map CMS category values to source JSON keys
 */
const CATEGORY_TO_KEY_MAP: Record<string, keyof HotlinesExport> = {
  Emergency: 'emergencyHotlines',
  Disaster: 'disasterHotlines',
  Security: 'securityHotlines',
  Transport: 'transportHotlines',
  Weather: 'weatherHotlines',
  Utility: 'utilityHotlines',
  'Social Services': 'socialServicesHotlines',
};

/**
 * Export hotlines from CMS to JSON format
 *
 * @param payload Payload instance
 * @returns Hotlines object grouped by category
 */
export async function exportHotlines(
  payload: PayloadClient
): Promise<HotlinesExport> {
  console.log('📦 Exporting hotlines...');

  // Fetch all hotlines
  const result = await payload.find({
    collection: 'hotlines',
    limit: 1000,
    sort: 'name',
  });

  console.log(`   Found ${result.docs.length} hotlines`);

  // Initialize output structure
  const output: HotlinesExport = {
    emergencyHotlines: [],
    disasterHotlines: [],
    securityHotlines: [],
    transportHotlines: [],
    weatherHotlines: [],
    utilityHotlines: [],
    socialServicesHotlines: [],
    criticalHotlines: [],
  };

  // Process each hotline
  for (const doc of result.docs) {
    // Unwrap contactNumbers array: [{number}] → [number]
    const numbers = unwrapArrayField(
      doc.contactNumbers as Array<{ number: string }> | undefined,
      'number'
    );

    const hotline: HotlineExport = {
      name: doc.name,
      category: doc.category,
      numbers,
      description: doc.description,
    };

    // Add to appropriate category array
    const categoryKey = CATEGORY_TO_KEY_MAP[doc.category];
    if (categoryKey) {
      output[categoryKey].push(hotline);
    } else {
      console.warn(`⚠️  Unknown category: ${doc.category} for ${doc.name}`);
    }

    // If featured, also add to criticalHotlines
    if (doc.featured) {
      output.criticalHotlines.push(hotline);
    }
  }

  // Log summary
  console.log(`   Emergency: ${output.emergencyHotlines.length}`);
  console.log(`   Disaster: ${output.disasterHotlines.length}`);
  console.log(`   Security: ${output.securityHotlines.length}`);
  console.log(`   Transport: ${output.transportHotlines.length}`);
  console.log(`   Weather: ${output.weatherHotlines.length}`);
  console.log(`   Utility: ${output.utilityHotlines.length}`);
  console.log(`   Social Services: ${output.socialServicesHotlines.length}`);
  console.log(`   Critical: ${output.criticalHotlines.length}`);

  console.log(`✅ Exported ${result.docs.length} hotlines`);
  return output;
}
