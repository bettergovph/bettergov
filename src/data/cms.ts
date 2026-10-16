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
  'Service data is missing from src/data. Restore the committed files with `git checkout -- src/data`.';

/**
 * These datasets are committed under src/data — originally imported from
 * TalaCMS, now edited in the repository like any other data file.
 *
 * `import.meta.glob` resolves to `{}` when nothing matches, instead of
 * failing the transform the way a static `import` of an absent file would,
 * so a deleted file surfaces as the MISSING error above rather than a
 * bundler error.
 *
 * Every glob call below runs with `{ eager: true }`, so the emptiness check
 * — categories' and hotlines' via `required()`, services' inline below —
 * executes and can throw the moment this module is evaluated, not lazily
 * when a caller later reads one specific export. Importing any one of
 * `serviceCategories`, `criticalHotlines`, or `services` therefore evaluates
 * and validates all three datasets: there is no way to import just one
 * without the others' presence being checked too.
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
 * One committed file per taxonomy category under src/data/services/, named
 * by category slug. `src/data/services/schema/**` is the contract the files
 * must satisfy, not data, and is not globbed.
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
