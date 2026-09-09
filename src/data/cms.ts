import type { Service } from '../types';
import type { RegionLGU } from '../lib/lgu';

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

/**
 * The two chambers of Congress. `house_members` and
 * `party_list_representatives` are nested inside the House record — the app
 * has always read them from there, and the sync fills them from the chamber's
 * CMS relations rather than from separate files.
 *
 * `chamber` is not just a label: senate-committees.tsx selects on
 * `chamber.includes('Senate')` and the two member pages on
 * `chamber.includes('House of Representatives')`. The sync gates both.
 */
export interface LegislativeChamber {
  slug: string;
  chamber: string;
  [key: string]: unknown;
}

const legislativeModules = import.meta.glob<{ default: LegislativeChamber[] }>(
  './directory/legislative.json',
  { eager: true }
);

export const legislativeChambers: LegislativeChamber[] =
  required(legislativeModules);

/**
 * LGU data is one file per region (19 files) rather than a single file, so
 * it follows the `services` glob-array pattern, not `required()`. The
 * `Object.keys(...).length === 0` guard matters here for the same reason it
 * matters for services: `import.meta.glob` resolves to `{}` when nothing
 * matches, instead of failing the build the way a static `import` of an
 * absent file would. Without this guard, a never-synced checkout would
 * silently produce an empty `lguRegions` array — every LGU page would
 * quietly render zero regions instead of the build failing loudly.
 */
const lguModules = import.meta.glob<{ default: RegionLGU }>(
  './directory/lgu/*.json',
  { eager: true }
);

if (Object.keys(lguModules).length === 0) throw new Error(MISSING);

export const lguRegions: RegionLGU[] = Object.values(lguModules).map(
  m => m.default
);

/**
 * The diplomatic directory: foreign missions, consulates, and international
 * organizations. Unlike every other generated directory dataset this is a
 * single OBJECT keyed by entity type, not an array — one TalaCMS model
 * (`DiplomaticEntity`) discriminated by `entityType`, grouped into the three
 * arrays the three /government/diplomatic pages have always read.
 *
 * Only missions carry a `slug`: they are the only group that appears in the
 * aggregate directory (`src/lib/directory.ts`). Consulates and organizations
 * have no detail route and therefore no slug.
 *
 * `title` is `string | null | undefined` on purpose. Four missions carry an
 * explicit `null` in both TalaCMS and the generated file, and the tracked
 * schema types it ["string","null"]; every other record simply omits the key.
 * Consumers must treat null and absent alike.
 */
export interface DiplomaticMission {
  slug: string;
  country: string;
  office_name: string;
  address?: string;
  contact?: string;
  email?: string;
  website?: string;
  representative?: string;
  title?: string | null;
}

export interface DiplomaticConsulate {
  country: string;
  office_name: string;
  address?: string;
  contact?: string;
  email?: string;
  website?: string;
  representative?: string;
  title?: string | null;
}

export interface DiplomaticOrganization {
  organization_name: string;
  address?: string;
  contact?: string;
  email?: string;
  website?: string;
  head?: string;
  title?: string | null;
}

export interface DiplomaticEntities {
  'Diplomatic Mission': DiplomaticMission[];
  Consulate: DiplomaticConsulate[];
  'International Organization': DiplomaticOrganization[];
}

const diplomaticModules = import.meta.glob<{ default: DiplomaticEntities }>(
  './directory/diplomatic.json',
  { eager: true }
);

export const diplomaticEntities: DiplomaticEntities =
  required(diplomaticModules);
