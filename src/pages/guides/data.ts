import manifest from '../../data/guides/manifest.json';

export const GUIDE_CATEGORIES = [
  'All',
  'Travel & ID',
  'Taxes',
  'Health',
  'Benefits',
  'Business',
  'Property',
  'Civil Registry',
] as const;

export type GuideCategory = (typeof GUIDE_CATEGORIES)[number];

export type GuideSummary = {
  id: string;
  title: string;
  agency: string;
  cat: string;
  steps: number;
  time: string;
  lede: string;
  reviewedAt: string;
  sourceUrl: string;
  featured?: string;
};

/** Editorial order, with dates taken from the source research. */
export const GUIDES: GuideSummary[] = manifest;
export const findGuide = (id: string) => GUIDES.find(g => g.id === id);
export const guideHref = (guide: GuideSummary) => `/guides/${guide.id}`;
export const formatGuideDate = (date: string) =>
  new Intl.DateTimeFormat('en-PH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Manila',
  }).format(new Date(`${date}T00:00:00Z`));
export const latestGuideReview = GUIDES.reduce(
  (latest, guide) => (guide.reviewedAt > latest ? guide.reviewedAt : latest),
  ''
);
