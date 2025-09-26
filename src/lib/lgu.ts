export interface Official {
  name?: string;
  contact?: string;
}

export interface City {
  city: string;
  mayor?: Official;
  vice_mayor?: Official;
}

export interface Municipality {
  municipality: string;
  zip_code?: string;
  mayor?: Official;
  vice_mayor?: Official;
}

export interface Province {
  province: string;
  cities?: City[];
  municipalities?: Municipality[];
}

export interface RegionLGU {
  region: string;
  slug: string;
  cities?: City[];
  municipalities?: Municipality[];
  provinces?: Province[];
}

// Discover JSON files in src/data/directory/lgu/*.json
const modules = import.meta.glob<{ default: RegionLGU }>(
  '../data/directory/lgu/*.json'
);

function pathToSlug(path: string): string {
  const file = path.split('/').pop() || '';
  return file.replace(/\.json$/, '');
}

export async function loadRegionLgu(
  slug: string | undefined | null
): Promise<RegionLGU | null> {
  if (!slug) return null;
  // 1) Try filename match
  const direct = Object.entries(modules).find(([p]) => pathToSlug(p) === slug);
  if (direct) {
    const mod = await direct[1]();
    const data = mod.default;
    return data;
  }
  // 2) Fallback: scan all and match by internal slug
  const allEntries: RegionLGU[] = await Promise.all(
    Object.values(modules).map(async importer => {
      const mod = await importer();
      return mod.default;
    })
  );
  return allEntries.find(r => r.slug === slug) || null;
}

export async function loadAllRegionLgu(): Promise<RegionLGU[]> {
  const entries: RegionLGU[] = await Promise.all(
    Object.values(modules).map(async importer => {
      const mod = await importer();
      return mod.default;
    })
  );
  return entries;
}
