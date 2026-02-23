/**
 * Visa exporter
 * Exports visa categories, types, and policies to JSON format
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { PayloadClient } from '../payload-client.js';
import { unwrapArrayField } from '../utils/reverse-transformers.js';

/**
 * Visa subtype export structure
 */
interface VisaSubtypeExport {
  id: string;
  name: string;
  description: string;
  requirements?: string[] | { businessOwners: string[]; employees: string[] };
}

/**
 * Visa type export structure
 */
interface VisaTypeExport {
  id: string;
  name: string;
  description: string;
  url: string;
  minimumRequirements: string[];
  subtypes?: VisaSubtypeExport[];
}

/**
 * Visa category export structure
 */
interface VisaCategoryExport {
  id: string;
  name: string;
  description: string;
  visaTypes: VisaTypeExport[];
}

/**
 * Visa types export structure (full document)
 */
export interface VisaTypesExport {
  sourceInfo: {
    lastUpdated: string;
    source: string;
  };
  categories: VisaCategoryExport[];
}

/**
 * Visa policy export structure
 */
interface VisaPolicyExport {
  id: string;
  title: string;
  description: string;
  countries?: string[];
  requirements?: string[];
  additionalInfo?: string;
  eligibleGroups?: string[];
  policies?: Array<{
    group: string;
    policy: string;
  }>;
}

/**
 * Visa policy export structure (full document)
 */
export interface VisaPolicyDocumentExport {
  sourceInfo: {
    lastUpdated: string;
    source: string;
  };
  visaFreeEntryPolicies: VisaPolicyExport[];
  visaRequiredNationals: string[];
  visaTypes: Array<{
    id: string;
    name: string;
    description: string;
    url: string;
    minimumRequirements: string[];
    subtypes?: VisaSubtypeExport[];
  }>;
}

/**
 * Transform a visa type document to export format
 * Handles unwrapping of requirements arrays and subtype processing
 */
function transformVisaType(visaTypeDoc: any): VisaTypeExport {
  // Unwrap minimumRequirements
  const minimumRequirements = unwrapArrayField<string>(
    visaTypeDoc.minimumRequirements as Array<Record<string, string>>,
    'requirement'
  );

  const visaType: VisaTypeExport = {
    id: visaTypeDoc.visa_id,
    name: visaTypeDoc.name,
    description: visaTypeDoc.description || '',
    url: visaTypeDoc.url || '',
    minimumRequirements,
  };

  // Handle subtypes if present
  if (visaTypeDoc.subtypes && Array.isArray(visaTypeDoc.subtypes)) {
    const subtypes: VisaSubtypeExport[] = [];

    for (const subtypeDoc of visaTypeDoc.subtypes) {
      const subtype: VisaSubtypeExport = {
        id: subtypeDoc.subtype_id,
        name: subtypeDoc.name,
        description: subtypeDoc.description || '',
      };

      // Handle simple requirements array
      if (subtypeDoc.requirements && Array.isArray(subtypeDoc.requirements)) {
        const requirements = unwrapArrayField<string>(
          subtypeDoc.requirements as Array<Record<string, string>>,
          'requirement'
        );
        if (requirements.length > 0) {
          subtype.requirements = requirements;
        }
      }

      // Handle role-based requirements (businessOwners, employees)
      if (subtypeDoc.requirementsByRole) {
        const businessOwners = unwrapArrayField<string>(
          (subtypeDoc.requirementsByRole.businessOwners || []) as Array<
            Record<string, string>
          >,
          'requirement'
        );
        const employees = unwrapArrayField<string>(
          (subtypeDoc.requirementsByRole.employees || []) as Array<
            Record<string, string>
          >,
          'requirement'
        );

        if (businessOwners.length > 0 || employees.length > 0) {
          subtype.requirements = {
            businessOwners,
            employees,
          };
        }
      }

      subtypes.push(subtype);
    }

    if (subtypes.length > 0) {
      visaType.subtypes = subtypes;
    }
  }

  return visaType;
}

/**
 * Export visa categories with nested visa types
 */
export async function exportVisaTypes(
  payload: PayloadClient
): Promise<VisaTypesExport> {
  console.log('📦 Exporting visa types...');

  // Fetch all visa categories
  const categoriesResult = await payload.find({
    collection: 'visa-categories',
    limit: 100,
    sort: 'name',
  });

  console.log(`   Found ${categoriesResult.docs.length} visa categories`);

  // Fetch all visa types
  const visaTypesResult = await payload.find({
    collection: 'visa-types',
    limit: 1000,
    depth: 1, // Populate category relationship
    sort: 'name',
  });

  console.log(`   Found ${visaTypesResult.docs.length} visa types`);

  // Group visa types by category
  const visaTypesByCategory: Record<string, any[]> = {};

  for (const visaType of visaTypesResult.docs) {
    const category =
      typeof visaType.category === 'object' ? visaType.category : null;
    if (!category) continue;

    const categoryId = category.id_code || String(category.id);

    if (!visaTypesByCategory[categoryId]) {
      visaTypesByCategory[categoryId] = [];
    }

    visaTypesByCategory[categoryId].push(visaType);
  }

  // Build categories with nested visa types
  const categories: VisaCategoryExport[] = [];

  for (const categoryDoc of categoriesResult.docs) {
    const categoryId = categoryDoc.id_code || String(categoryDoc.id);
    const visaTypes = visaTypesByCategory[categoryId] || [];

    const categoryExport: VisaCategoryExport = {
      id: categoryDoc.id_code,
      name: categoryDoc.name,
      description: categoryDoc.description || '',
      visaTypes: [],
    };

    // Transform visa types
    for (const visaTypeDoc of visaTypes) {
      const visaType = transformVisaType(visaTypeDoc);
      categoryExport.visaTypes.push(visaType);
    }

    categories.push(categoryExport);
  }

  console.log(`✅ Exported ${categories.length} visa categories`);

  return {
    sourceInfo: {
      lastUpdated: new Date().toISOString().split('T')[0],
      source: 'Philippine Bureau of Immigration',
    },
    categories,
  };
}

/**
 * Export visa policies
 */
export async function exportVisaPolicies(
  payload: PayloadClient
): Promise<VisaPolicyDocumentExport> {
  console.log('📦 Exporting visa policies...');

  // Fetch all visa policies
  const policiesResult = await payload.find({
    collection: 'visa-policies',
    limit: 1000,
    sort: 'title',
  });

  console.log(`   Found ${policiesResult.docs.length} visa policies`);

  // Transform visa policies
  const visaFreeEntryPolicies: VisaPolicyExport[] = [];

  for (const policyDoc of policiesResult.docs) {
    const policy: VisaPolicyExport = {
      id: policyDoc.policy_id,
      title: policyDoc.title,
      description: policyDoc.description || '',
    };

    // Unwrap countries array
    if (policyDoc.countries && Array.isArray(policyDoc.countries)) {
      const countries = unwrapArrayField<string>(
        policyDoc.countries as Array<Record<string, string>>,
        'country'
      );
      if (countries.length > 0) {
        policy.countries = countries;
      }
    }

    // Unwrap requirements array
    if (policyDoc.requirements && Array.isArray(policyDoc.requirements)) {
      const requirements = unwrapArrayField<string>(
        policyDoc.requirements as Array<Record<string, string>>,
        'requirement'
      );
      if (requirements.length > 0) {
        policy.requirements = requirements;
      }
    }

    // Add additional info
    if (policyDoc.additionalInfo) {
      policy.additionalInfo = policyDoc.additionalInfo;
    }

    // Unwrap eligible groups
    if (policyDoc.eligibleGroups && Array.isArray(policyDoc.eligibleGroups)) {
      const eligibleGroups = unwrapArrayField<string>(
        policyDoc.eligibleGroups as Array<Record<string, string>>,
        'group'
      );
      if (eligibleGroups.length > 0) {
        policy.eligibleGroups = eligibleGroups;
      }
    }

    // Handle policy groups (for HK/Macau style policies)
    if (policyDoc.policyGroups && Array.isArray(policyDoc.policyGroups)) {
      const policyGroups = policyDoc.policyGroups.map((pg: any) => ({
        group: pg.group,
        policy: pg.policy,
      }));
      if (policyGroups.length > 0) {
        policy.policies = policyGroups;
      }
    }

    visaFreeEntryPolicies.push(policy);
  }

  // Fetch visa types for the policy document (duplicate from visa types export)
  const visaTypesResult = await payload.find({
    collection: 'visa-types',
    limit: 1000,
    depth: 1,
    sort: 'name',
  });

  const visaTypes: VisaPolicyDocumentExport['visaTypes'] = [];

  for (const visaTypeDoc of visaTypesResult.docs) {
    const visaType = transformVisaType(visaTypeDoc);
    visaTypes.push(visaType);
  }

  console.log(`✅ Exported ${visaFreeEntryPolicies.length} visa policies`);

  return {
    sourceInfo: {
      lastUpdated: new Date().toISOString().split('T')[0],
      source: 'Philippine Bureau of Immigration',
    },
    visaFreeEntryPolicies,
    visaRequiredNationals: [],
    visaTypes,
  };
}
