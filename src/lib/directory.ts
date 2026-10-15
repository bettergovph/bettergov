import constitutional from '../data/directory/constitutional.json';
import departments from '../data/directory/departments.json';
import executive from '../data/directory/executive.json';
import diplomatic from '../data/directory/diplomatic.json';
import legislative from '../data/directory/legislative.json';

export type DirectoryBranch =
  | 'Executive'
  | 'Constitutional'
  | 'Legislative'
  | 'Diplomatic';

/**
 * Finer-grained discriminator for pages that filter to a single source file
 * (e.g. /government/departments vs /government/executive).
 */
export type DirectoryKind =
  | 'department'
  | 'executive'
  | 'constitutional'
  | 'legislative'
  | 'diplomatic';

export type DirectoryEntry = {
  slug: string;
  /** Display name, title-cased. */
  name: string;
  /** Short acronym derived from parenthetical or ALL-CAPS initials. */
  abbr?: string;
  branch: DirectoryBranch;
  kind: DirectoryKind;
  /** Heading role of the first official (e.g. "Chairperson", "Secretary"). */
  headRole?: string;
  head?: string;
  address?: string;
  /** Display-friendly city derived from address. */
  loc?: string;
  hotline?: string;
  /** Website hostname, no protocol. */
  web?: string;
  /** Where the row should link when clicked (branch-specific detail page). */
  detailHref: string;
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const STOPWORDS = new Set([
  'OF',
  'AND',
  'THE',
  'FOR',
  'ON',
  'IN',
  'TO',
  'A',
  'AN',
  '&',
  'AT',
]);

/** Keep parenthetical acronyms uppercase, otherwise title-case. */
export function titleCase(s: string): string {
  if (!s) return s;
  const looksAllCaps = s === s.toUpperCase();
  if (!looksAllCaps) return s;
  // Preserve "(CSC)"-style chunks
  return s
    .split(/(\([^)]+\))/g)
    .map(chunk => {
      if (chunk.startsWith('(') && chunk.endsWith(')')) return chunk;
      return chunk
        .toLowerCase()
        .replace(/\b([a-z])/g, c => c.toUpperCase())
        .replace(
          / (Of|And|The|For|On|In|To|A|An|At) /g,
          (_m, w) => ' ' + w.toLowerCase() + ' '
        );
    })
    .join('')
    .trim();
}

function deriveAbbr(name: string): string | undefined {
  const paren = name.match(/\(([A-Z][A-Z0-9-]+)\)/);
  if (paren) return paren[1];

  const cleaned = name
    .replace(/\([^)]+\)/g, '')
    .replace(/[^A-Za-z\s]/g, ' ')
    .trim();
  const words = cleaned.split(/\s+/);
  const allCaps = words.every(w => w === w.toUpperCase() && w.length > 0);
  if (!allCaps) return undefined;

  const majors = words.filter(w => !STOPWORDS.has(w.toUpperCase()));
  if (majors.length < 2 || majors.length > 6) return undefined;
  return majors
    .map(w => w[0])
    .join('')
    .toUpperCase();
}

const KNOWN_CITIES = [
  'Quezon City',
  'Makati City',
  'Makati',
  'Pasay City',
  'Pasig City',
  'Pasig',
  'Mandaluyong City',
  'Mandaluyong',
  'Taguig City',
  'Taguig',
  'Parañaque City',
  'Parañaque',
  'Muntinlupa City',
  'Muntinlupa',
  'Las Piñas City',
  'Las Piñas',
  'San Juan City',
  'San Juan',
  'Marikina City',
  'Marikina',
  'Caloocan City',
  'Caloocan',
  'Navotas City',
  'Navotas',
  'Valenzuela City',
  'Valenzuela',
  'Malabon City',
  'Malabon',
  'Manila',
];

function deriveLoc(address: string | undefined): string | undefined {
  if (!address) return undefined;
  for (const c of KNOWN_CITIES) {
    if (
      new RegExp(`\\b${c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(
        address
      )
    ) {
      return c;
    }
  }
  return undefined;
}

function stripProtocol(web: string | undefined | null): string | undefined {
  if (!web) return undefined;
  return web.replace(/^https?:\/\//i, '').replace(/\/$/, '');
}

type OfficialLike = {
  name?: string;
  role?: string;
  personnel?: Array<{ name?: string; role?: string }>;
};

/** Walk officials (flat + nested "personnel") and return the first named person + role. */
function firstPerson(officials: OfficialLike[] | undefined): {
  name?: string;
  role?: string;
} {
  for (const o of officials ?? []) {
    if (o.name) return { name: o.name, role: o.role };
    if (Array.isArray(o.personnel) && o.personnel.length > 0) {
      const f = o.personnel.find(p => !!p.name);
      if (f?.name) return { name: f.name, role: f.role };
    }
  }
  return {};
}

/* -------------------------------------------------------------------------- */
/*  Flatteners                                                                 */
/* -------------------------------------------------------------------------- */

type ConstitutionalSrc = {
  slug: string;
  name: string;
  address?: string;
  trunklines?: string[];
  website?: string;
  officials?: OfficialLike[];
};

type DepartmentSrc = {
  slug: string;
  office_name: string;
  address?: string;
  trunkline?: string;
  website?: string;
  secretary?: { name?: string; role?: string };
};

type ExecutiveSrc = {
  slug: string;
  office: string;
  address?: string;
  trunkline?: string;
  website?: string;
  officials?: OfficialLike[];
};

type LegislativeSrc = {
  slug: string;
  chamber: string;
  address?: string;
  trunkline?: string;
  website?: string;
  officials?: OfficialLike[];
};

type DiplomaticSrc = {
  slug: string;
  country: string;
  office_name: string;
  address?: string;
  contact?: string;
  representative?: string;
  title?: string;
  website?: string;
};

function flattenConstitutional(): DirectoryEntry[] {
  return (constitutional as ConstitutionalSrc[]).map(c => {
    const head = firstPerson(c.officials);
    return {
      slug: c.slug,
      name: titleCase(c.name),
      abbr: deriveAbbr(c.name),
      branch: 'Constitutional',
      kind: 'constitutional',
      headRole: head.role,
      head: head.name,
      address: c.address,
      loc: deriveLoc(c.address),
      hotline: c.trunklines?.[0],
      web: stripProtocol(c.website),
      detailHref: `/government/constitutional/${c.slug}`,
    };
  });
}

function flattenDepartments(): DirectoryEntry[] {
  return (departments as DepartmentSrc[]).map(d => ({
    slug: d.slug,
    name: titleCase(d.office_name),
    abbr: deriveAbbr(d.office_name),
    branch: 'Executive',
    kind: 'department',
    headRole: d.secretary?.role ?? 'Secretary',
    head: d.secretary?.name,
    address: d.address,
    loc: deriveLoc(d.address),
    hotline: d.trunkline,
    web: stripProtocol(d.website),
    detailHref: `/government/departments/${d.slug}`,
  }));
}

/** Executive slugs that have a dedicated detail route in src/App.tsx. */
const EXECUTIVE_DETAIL_ROUTES = new Set([
  'office-of-the-president',
  'office-of-the-vice-president',
  'presidential-communications-office',
]);

function flattenExecutive(): DirectoryEntry[] {
  return (executive as ExecutiveSrc[]).map(e => {
    const head = firstPerson(e.officials);
    const detailHref = EXECUTIVE_DETAIL_ROUTES.has(e.slug)
      ? `/government/executive/${e.slug}`
      : '/government/executive/other-executive-offices';
    return {
      slug: e.slug,
      name: titleCase(e.office),
      abbr: deriveAbbr(e.office),
      branch: 'Executive',
      kind: 'executive',
      headRole: head.role,
      head: head.name,
      address: e.address,
      loc: deriveLoc(e.address),
      hotline: e.trunkline,
      web: stripProtocol(e.website),
      detailHref,
    };
  });
}

function flattenLegislative(): DirectoryEntry[] {
  return (legislative as LegislativeSrc[]).map(l => {
    const head = firstPerson(l.officials);
    return {
      slug: l.slug,
      name: titleCase(l.chamber),
      abbr: deriveAbbr(l.chamber),
      branch: 'Legislative',
      kind: 'legislative',
      headRole: head.role,
      head: head.name,
      address: l.address,
      loc: deriveLoc(l.address),
      hotline: l.trunkline,
      web: stripProtocol(l.website),
      detailHref: `/government/legislative/${l.slug}`,
    };
  });
}

function flattenDiplomatic(): DirectoryEntry[] {
  const missions = (diplomatic as { 'Diplomatic Mission'?: DiplomaticSrc[] })[
    'Diplomatic Mission'
  ];
  return (missions ?? []).map(m => ({
    slug: m.slug,
    name: m.office_name,
    abbr: undefined,
    branch: 'Diplomatic',
    kind: 'diplomatic',
    headRole: m.title,
    head: m.representative,
    address: m.address,
    loc: deriveLoc(m.address),
    hotline: m.contact,
    web: stripProtocol(m.website),
    detailHref: '/government/diplomatic/missions',
  }));
}

/* -------------------------------------------------------------------------- */
/*  Public API                                                                 */
/* -------------------------------------------------------------------------- */

let cached: DirectoryEntry[] | null = null;

export function loadDirectoryEntries(): DirectoryEntry[] {
  if (cached) return cached;
  cached = [
    ...flattenExecutive(),
    ...flattenDepartments(),
    ...flattenConstitutional(),
    ...flattenLegislative(),
    ...flattenDiplomatic(),
  ];
  return cached;
}

export const DIRECTORY_BRANCHES: readonly DirectoryBranch[] = [
  'Executive',
  'Constitutional',
  'Legislative',
  'Diplomatic',
];

/** Subset of entries by DirectoryKind. */
export function entriesByKind(kind: DirectoryKind): DirectoryEntry[] {
  return loadDirectoryEntries().filter(e => e.kind === kind);
}

/** Subset of entries by DirectoryBranch. */
export function entriesByBranch(branch: DirectoryBranch): DirectoryEntry[] {
  return loadDirectoryEntries().filter(e => e.branch === branch);
}
