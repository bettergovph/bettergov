import type { Service } from '../types';

export interface Subcategory {
  name: string;
  slug: string;
}

export interface Category {
  category: string;
  slug: string;
  subcategories: Subcategory[];
}

export interface Hotline {
  name: string;
  category: string;
  numbers: string[];
  description: string;
}

const MISSING =
  'Generated CMS data is missing. Run the CMS sync script defined in package.json before building.';

/**
 * `import.meta.glob` resolves to `{}` when nothing matches, instead of
 * failing the transform the way a static `import` of an absent file would —
 * this is what lets `vite build`/`vitest` run against a checkout that has
 * never been synced.
 *
 * Every glob call below runs with `{ eager: true }`, so the emptiness check
 * — categories' and hotlines' via `required()`, services' inline below —
 * executes and can throw the moment this module is evaluated, not lazily
 * when a caller later reads one specific export. Importing any one of
 * `serviceCategories`, `criticalHotlines`, or `services` therefore evaluates
 * and validates all three generated datasets: there is no way to import
 * just one without the others' presence being checked too.
 */
function required<T>(modules: Record<string, { default: T }>): T {
  const modulePath = Object.keys(modules)[0];
  if (!modulePath) throw new Error(MISSING);
  return modules[modulePath].default;
}

const categoriesModules = import.meta.glob<{
  default: { categories: Category[] };
}>('./service_categories.json', { eager: true });

export const serviceCategories: { categories: Category[] } =
  required(categoriesModules);

const hotlinesModules = import.meta.glob<{ default: Hotline[] }>(
  './critical_hotlines.json',
  { eager: true }
);

export const criticalHotlines: Hotline[] = required(hotlinesModules);

/**
 * Service records are generated the same way as the two datasets above —
 * `npm run sync:talacms` writes one gitignored file per taxonomy category
 * under src/data/services/. `src/data/services/schema/**` stays tracked;
 * it's the contract, not the data.
 *
 * Codepoint-sorted by filename, same as `import.meta.glob`'s own default
 * ordering — carried over from the contract test this accessor replaces.
 */
const serviceModules = import.meta.glob<{ default: Service[] }>(
  './services/*.json',
  { eager: true }
);

if (Object.keys(serviceModules).length === 0) throw new Error(MISSING);

/** Service records keyed by category slug (the service file's basename). */
export const services: Record<string, Service[]> = Object.fromEntries(
  Object.entries(serviceModules).map(([path, mod]) => [
    path.split('/').pop()!.replace('.json', ''),
    mod.default,
  ])
);

export interface GovernmentDepartment {
  slug: string;
  office_name: string;
  [key: string]: unknown;
}

export interface ExecutiveOffice {
  slug: string;
  office: string;
  [key: string]: unknown;
}

const departmentsModules = import.meta.glob<{
  default: GovernmentDepartment[];
}>('./directory/departments.json', { eager: true });

export const governmentDepartments: GovernmentDepartment[] =
  required(departmentsModules);

const executiveModules = import.meta.glob<{ default: ExecutiveOffice[] }>(
  './directory/executive.json',
  { eager: true }
);

export const executiveOffices: ExecutiveOffice[] = required(executiveModules);

/**
 * Constitutional Offices holds all 229 directory records — the 5 genuine
 * constitutional bodies plus 110 GOCCs and 114 SUCs. They share one CMS
 * model, one generated file and one route tree, so they are CMS-owned
 * together.
 */
export interface ConstitutionalDirectoryOffice {
  slug: string;
  name: string;
  office_type: string;
  [key: string]: unknown;
}

const constitutionalModules = import.meta.glob<{
  default: ConstitutionalDirectoryOffice[];
}>('./directory/constitutional.json', { eager: true });

export const constitutionalOffices: ConstitutionalDirectoryOffice[] = required(
  constitutionalModules
);
