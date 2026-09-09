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
  // back to scanning for an internal `slug` field match, as a safety net in
  // case a region's output filename ever diverged from its own `slug`
  // field. That divergence is not merely absent from today's 19 files — it
  // is structurally impossible for anything the sync pipeline produces:
  // `buildLguCandidates` in scripts/talacms/lgu.ts derives both the output
  // path (`src/data/directory/lgu/${r.region.slug}.json`) and the emitted
  // `slug` field (`shapeLguRegion`'s `out.slug = joined.region.slug`) from
  // the exact same `r.region.slug` value, in the same function call, before
  // either is written — there is no code path that can write a file whose
  // basename and internal `slug` field disagree. A single match on the
  // internal `slug` field is therefore equivalent to the original two-step
  // lookup for any file this pipeline can generate, not just the current set.
  return lguRegions.find(r => r.slug === slug) || null;
}

export async function loadAllRegionLgu(): Promise<RegionLGU[]> {
  return lguRegions;
}
