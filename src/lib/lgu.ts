import { lguRegions } from '../data/cms';

export { lguRegions };

export interface Official {
  name?: string;
  contact?: string;
  email?: string;
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

export async function loadRegionLgu(
  slug: string | undefined | null
): Promise<RegionLGU | null> {
  if (!slug) return null;
  // Previously this tried a filename-derived slug match first, then fell
  // back to scanning for an internal `slug` field match. Both paths now
  // resolve to the same lookup because the two are identical for
  // uniformly-generated data — filenames are the region's own slug — so a
  // single scan over `lguRegions` preserves both resolution paths' behavior.
  return lguRegions.find(r => r.slug === slug) || null;
}

export async function loadAllRegionLgu(): Promise<RegionLGU[]> {
  return lguRegions;
}
