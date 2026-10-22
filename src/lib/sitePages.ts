import { mainNavigation } from '../data/navigation';
import { serviceCategories } from '../data/cms';
import { executiveHeads } from '../data/directory/executive-heads';
import { GUIDES, guideHref } from '../pages/guides/data';
import { loadDirectoryEntries, type DirectoryEntry } from './directory';

/**
 * A page on GOV.PH itself that site search can return alongside the
 * Meilisearch index, which only holds services, agency websites and
 * legislators. `type` reuses the index's facet values where they overlap
 * (`directory_item`), so the Type filter treats both the same.
 */
export interface SitePage {
  objectID: string;
  type: 'page' | 'guide' | 'directory_item';
  name: string;
  description?: string;
  /** Path on this site, e.g. /data/weather. */
  url: string;
  /** Shown beside the type badge, e.g. "Philippines" or "Department". */
  section?: string;
  /** Words people search with that the name and description lack. */
  keywords?: string;
  /** Directory entries only — the index uses the same slugs. */
  slug?: string;
}

/** Section landing pages, which have no menu blurb of their own. */
const SECTION_PAGES: Omit<SitePage, 'objectID' | 'type'>[] = [
  {
    name: 'Services',
    url: '/services',
    section: 'Services',
    description:
      'Browse and search a comprehensive directory of Philippine government services across categories and subcategories.',
  },
  {
    name: 'News',
    url: '/news',
    section: 'News',
    description:
      'Official news, press releases and circulars from the Philippine government, republished from e.gov.ph.',
  },
  {
    name: 'Guides',
    url: '/guides',
    section: 'Guides',
    description:
      'Plain-language guides to Philippine government transactions, with requirements, application steps, fees, and source references.',
  },
  {
    name: 'Government directory',
    url: '/government',
    section: 'Directory',
    description:
      'Every branch of the Philippine government in one directory — executive departments, constitutional bodies, the legislature, the courts, and diplomatic missions.',
  },
];

/** Pages outside the main menu, described as their own meta tags put it. */
const OTHER_PAGES: Omit<SitePage, 'objectID' | 'type'>[] = [
  {
    name: 'About GOV.PH',
    url: '/about',
    section: 'GOV.PH',
    description:
      'GOV.PH is the proposed portal of the Republic of the Philippines — one place to find government services, agencies, hotlines, and information.',
  },
  {
    name: 'Contact',
    url: '/contact',
    section: 'GOV.PH',
    keywords: '8888 hotline complaint feedback freedom of information',
  },
  {
    name: 'Accessibility',
    url: '/accessibility',
    section: 'GOV.PH',
    description:
      'What GOV.PH supports in tested pages, known barriers, and the work still needed towards WCAG 2.2 Level AA.',
  },
  {
    name: 'Sitemap',
    url: '/sitemap',
    section: 'GOV.PH',
    description: 'Find all pages and services on GOV.PH.',
  },
  {
    name: 'Terms of Service',
    url: '/terms-of-service',
    section: 'GOV.PH',
    description: 'Content licensing, disclaimers, and user responsibilities.',
  },
  {
    name: 'Government websites',
    url: '/services/websites',
    section: 'Services',
    description:
      'Official online presence of Philippine government agencies, bureaus, SUCs, and diplomatic posts.',
  },
  {
    name: 'Flood control projects',
    url: '/flood-control-projects',
    section: 'Transparency',
    description: 'Explore flood control projects across the Philippines.',
    keywords: 'DPWH infrastructure contractors',
  },
  ...(['president', 'vice-president'] as const).map(slug => {
    const head = executiveHeads[slug];
    return {
      name: head.title,
      url: `/government/executive/${slug}`,
      section: 'Executive',
      description: head.lede,
      keywords: head.fullName,
    };
  }),
  {
    name: 'Executive branch',
    url: '/government/executive',
    section: 'Directory',
    description:
      'Offices, bureaus, and councils under the Executive branch — from the Office of the President to independent boards and commissions.',
  },
  {
    name: 'Constitutional commissions and offices',
    url: '/government/constitutional',
    section: 'Directory',
    description:
      'Constitutional commissions and offices created by the 1987 Philippine Constitution — independent bodies with specific mandates.',
  },
  {
    name: 'Government-owned and controlled corporations',
    url: '/government/constitutional/goccs',
    section: 'Directory',
    description:
      'State corporations with commercial operations, chartered by law to serve public or regulatory purposes.',
    keywords: 'GOCC GOCCs',
  },
  {
    name: 'State universities and colleges',
    url: '/government/constitutional/sucs',
    section: 'Directory',
    description:
      'Public higher-education institutions funded by the national government.',
    keywords: 'SUC SUCs',
  },
  {
    name: 'Legislative branch',
    url: '/government/legislative',
    section: 'Directory',
    description:
      'The Senate of the Philippines and the House of Representatives — the two chambers of the Philippine Congress.',
    keywords: 'Congress',
  },
  {
    name: 'House members',
    url: '/government/legislative/house-members',
    section: 'Directory',
    description:
      'District representatives of the Philippine House of Representatives — sortable by province/city and searchable by name.',
    keywords: 'congressman congresswoman representative district',
  },
  {
    name: 'Party-list members',
    url: '/government/legislative/party-list-members',
    section: 'Directory',
    description:
      'Party-list representatives of the Philippine House of Representatives.',
  },
  {
    name: 'Senate committees',
    url: '/government/legislative/senate-committees',
    section: 'Directory',
    description:
      'Permanent committees of the Philippine Senate and their chairpersons.',
  },
  {
    name: 'Judiciary',
    url: '/government/judicial',
    section: 'Directory',
    description:
      'The Supreme Court of the Philippines, the Court of Appeals, and the Sandiganbayan — the courts of the Judicial branch and their justices.',
    keywords: 'judicial courts justices',
  },
  {
    name: 'Diplomatic missions',
    url: '/government/diplomatic',
    section: 'Directory',
    description:
      'Foreign embassies, consulates, and diplomatic missions accredited to the Republic of the Philippines.',
  },
  {
    name: 'Embassies and high commissions',
    url: '/government/diplomatic/missions',
    section: 'Directory',
    description:
      'Foreign embassies and high commissions accredited to the Republic of the Philippines.',
    keywords: 'embassy',
  },
  {
    name: 'Consulates',
    url: '/government/diplomatic/consulates',
    section: 'Directory',
    description:
      'Consulates and honorary consulates in the Philippines — representation of foreign states outside the main embassy.',
  },
  {
    name: 'International organizations',
    url: '/government/diplomatic/organizations',
    section: 'Directory',
    description:
      'Offices of the United Nations, multilateral banks, and other international organizations hosted in the Philippines.',
  },
  {
    name: 'Local government',
    url: '/government/local',
    section: 'Directory',
    description:
      'Local government units of the Philippines — regions, provinces, cities, and municipalities.',
    keywords: 'LGU LGUs province city municipality',
  },
];

/** Words people search for that a page's title and blurb don't contain. */
const PAGE_KEYWORDS: Record<string, string> = {
  '/philippines/hotlines': 'emergency 911 police fire ambulance rescue',
  '/philippines/holidays': 'holiday non-working day calendar',
  '/data/weather': 'forecast temperature rain typhoon',
  '/data/forex': 'exchange rate currency peso dollar',
  '/travel/visa': 'visa immigration entry tourist',
};

/** The departments' own abbreviations, which the directory doesn't carry. */
const DEPARTMENT_ACRONYMS: Record<string, string> = {
  'department-of-agrarian-reform': 'DAR',
  'department-of-agriculture': 'DA',
  'department-of-budget-and-management': 'DBM',
  'department-of-economy-planning-and-development': 'DEPDev NEDA',
  'department-of-education': 'DepEd',
  'department-of-energy': 'DOE',
  'department-of-environment-and-natural-resources': 'DENR',
  'department-of-finance': 'DOF',
  'department-of-foreign-affairs': 'DFA',
  'department-of-health': 'DOH',
  'department-of-human-settlements-and-urban-development': 'DHSUD',
  'department-of-information-and-communications-technology': 'DICT',
  'department-of-justice': 'DOJ',
  'department-of-labor-and-employment': 'DOLE',
  'department-of-migrant-workers': 'DMW',
  'department-of-national-defense': 'DND',
  'department-of-public-works-and-highways': 'DPWH',
  'department-of-science-and-technology': 'DOST',
  'department-of-social-welfare-and-development': 'DSWD',
  'department-of-the-interior-and-local-government': 'DILG',
  'department-of-tourism': 'DOT',
  'department-of-trade-and-industry': 'DTI',
  'department-of-transportation': 'DOTr',
};

const DIRECTORY_SECTIONS: Record<DirectoryEntry['kind'], string> = {
  department: 'Department',
  executive: 'Executive',
  constitutional: 'Constitutional',
  legislative: 'Legislative',
  judicial: 'Judicial',
  diplomatic: 'Diplomatic',
};

const page = (p: Omit<SitePage, 'objectID' | 'type'>): SitePage => ({
  objectID: `page:${p.url}`,
  type: 'page',
  ...p,
  keywords:
    [p.keywords, PAGE_KEYWORDS[p.url]].filter(Boolean).join(' ') || undefined,
});

function menuPages(): SitePage[] {
  return mainNavigation.flatMap(item =>
    // Services' children are the categories, added with their
    // subcategories below; Transparency's are all external.
    item.label === 'Services'
      ? []
      : (item.children ?? [])
          .filter(child => child.href.startsWith('/'))
          .map(child =>
            page({
              name: child.label,
              url: child.href,
              section: item.label,
              description: child.blurb,
            })
          )
  );
}

function categoryPages(): SitePage[] {
  return serviceCategories.categories
    .filter(c => c.slug !== 'uncategorized')
    .map(c =>
      page({
        name: c.category,
        url: `/services?category=${c.slug}`,
        section: 'Services',
        description: c.subcategories.map(s => s.name).join(', '),
      })
    );
}

function guidePages(): SitePage[] {
  return GUIDES.map(g => ({
    objectID: `guide:${g.id}`,
    type: 'guide',
    name: g.title,
    description: g.lede,
    url: guideHref(g),
    section: g.agency,
    keywords: `${g.cat} ${g.id}`,
  }));
}

function directoryPages(): SitePage[] {
  return loadDirectoryEntries().map(e => ({
    objectID: `directory:${e.kind}:${e.slug}`,
    type: 'directory_item',
    name: e.name,
    description: e.head
      ? `${e.headRole ? `${e.headRole}: ` : ''}${e.head}`
      : undefined,
    url: e.detailHref,
    section: DIRECTORY_SECTIONS[e.kind],
    keywords:
      [e.abbr, DEPARTMENT_ACRONYMS[e.slug]].filter(Boolean).join(' ') ||
      undefined,
    slug: e.slug,
  }));
}

/**
 * Every searchable GOV.PH page, one per URL. A directory entry with a page
 * of its own (the Senate, a department) wins over a menu link to that page,
 * since it names the head of office. List pages that many entries share,
 * like the embassies list, keep their own listing too.
 */
export function buildSitePages(): SitePage[] {
  const directory = directoryPages();
  const entriesPerUrl = new Map<string, number>();
  for (const d of directory) {
    entriesPerUrl.set(d.url, (entriesPerUrl.get(d.url) ?? 0) + 1);
  }
  const seen = new Set<string>();
  const pages = [
    ...menuPages(),
    ...SECTION_PAGES.map(page),
    ...categoryPages(),
    ...OTHER_PAGES.map(page),
  ].filter(p => {
    if (seen.has(p.url) || entriesPerUrl.get(p.url) === 1) return false;
    seen.add(p.url);
    return true;
  });
  return [...pages, ...guidePages(), ...directory];
}
