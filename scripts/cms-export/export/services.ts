/**
 * Services exporter
 * Exports service categories, subcategories, and services to JSON format
 */

import type { PayloadClient } from '../payload-client.js';
import { unwrapArrayField } from '../utils/reverse-transformers.js';

export interface ServiceCategoryExport {
  category: string;
  slug: string;
  subcategories: Array<{
    name: string;
    slug: string;
  }>;
}

export interface ServiceCategoriesExport {
  categories: ServiceCategoryExport[];
}

export interface ServiceExport {
  service: string;
  url: string;
  id: string;
  slug: string;
  published: boolean;
  featured: boolean;
  category: {
    name: string;
    slug: string;
  };
  subcategory?: {
    name: string;
    slug: string;
  };
  description?: string;
  agency?: string;
  requirements?: string[];
  process?: string[];
  fees?: string;
  processingTime?: string;
  where?: string;
  contactInfo?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Export service categories with nested subcategories
 *
 * @param payload Payload instance
 * @returns Service categories object in source format
 */
export async function exportServiceCategories(
  payload: PayloadClient
): Promise<ServiceCategoriesExport> {
  console.log('📦 Exporting service categories...');

  // Fetch all categories
  const categoriesResult = await payload.find({
    collection: 'service-categories',
    limit: 1000,
    sort: 'name',
  });

  console.log(`   Found ${categoriesResult.docs.length} categories`);

  // Fetch all subcategories with populated category relationship
  const subcategoriesResult = await payload.find({
    collection: 'service-subcategories',
    limit: 1000,
    depth: 1,
  });

  console.log(`   Found ${subcategoriesResult.docs.length} subcategories`);

  // Group subcategories by category ID
  const subcategoriesByCategory: Record<
    number,
    Array<{ name: string; slug: string }>
  > = {};

  for (const subcat of subcategoriesResult.docs) {
    const categoryId =
      typeof subcat.category === 'object'
        ? subcat.category.id
        : subcat.category;

    if (!categoryId) continue;

    if (!subcategoriesByCategory[categoryId]) {
      subcategoriesByCategory[categoryId] = [];
    }

    subcategoriesByCategory[categoryId].push({
      name: subcat.name,
      slug: subcat.slug,
    });
  }

  // Build output structure
  const categories: ServiceCategoryExport[] = categoriesResult.docs.map(cat => {
    const subcategories = subcategoriesByCategory[cat.id as number] || [];

    return {
      category: cat.name,
      slug: cat.slug,
      subcategories,
    };
  });

  console.log(`✅ Exported ${categories.length} service categories`);

  return { categories };
}

/**
 * Export services grouped by category
 *
 * @param payload Payload instance
 * @returns Record of category slug to services array
 */
export async function exportServices(
  payload: PayloadClient
): Promise<Record<string, ServiceExport[]>> {
  console.log('📦 Exporting services...');

  // Fetch all services with populated relationships
  const result = await payload.find({
    collection: 'services',
    limit: 10000,
    depth: 2, // Populate category and subcategory
    sort: 'name',
  });

  console.log(`   Found ${result.docs.length} services`);

  // Transform services
  const services: ServiceExport[] = [];

  for (const doc of result.docs) {
    // Extract category info
    const category =
      typeof doc.category === 'object'
        ? { name: doc.category.name, slug: doc.category.slug }
        : { name: '', slug: '' };

    // Extract subcategory info if present
    const subcategory =
      doc.subcategory && typeof doc.subcategory === 'object'
        ? { name: doc.subcategory.name, slug: doc.subcategory.slug }
        : undefined;

    // Unwrap requirements array: [{requirement}] → [string]
    const requirements = unwrapArrayField(
      doc.requirements as Array<{ requirement: string }> | undefined,
      'requirement'
    );

    // Unwrap process array: [{step}] → [string]
    const process = unwrapArrayField(
      doc.process as Array<{ step: string }> | undefined,
      'step'
    );

    const service: ServiceExport = {
      service: doc.name,
      url: doc.url,
      id: String(doc.id),
      slug: doc.slug,
      published: doc.published ?? true,
      featured: doc.featured ?? false,
      category,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };

    // Add optional fields
    if (subcategory) service.subcategory = subcategory;
    if (doc.description) service.description = doc.description;
    if (doc.agency) service.agency = doc.agency;
    if (requirements.length > 0) service.requirements = requirements;
    if (process.length > 0) service.process = process;
    if (doc.fees) service.fees = doc.fees;
    if (doc.processingTime) service.processingTime = doc.processingTime;
    if (doc.where) service.where = doc.where;
    if (doc.contactInfo) service.contactInfo = doc.contactInfo;

    services.push(service);
  }

  // Group by category slug
  const servicesByCategory: Record<string, ServiceExport[]> = {};

  for (const service of services) {
    const categorySlug = service.category.slug;

    if (!categorySlug) {
      console.warn(`⚠️  Service without category slug: ${service.service}`);
      continue;
    }

    if (!servicesByCategory[categorySlug]) {
      servicesByCategory[categorySlug] = [];
    }

    servicesByCategory[categorySlug].push(service);
  }

  // Log summary
  const categoryCount = Object.keys(servicesByCategory).length;
  console.log(`   Grouped into ${categoryCount} categories:`);

  for (const [slug, categoryServices] of Object.entries(servicesByCategory)) {
    console.log(`     ${slug}: ${categoryServices.length} services`);
  }

  console.log(`✅ Exported ${services.length} services`);

  return servicesByCategory;
}
