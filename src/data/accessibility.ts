/** Dated review evidence, not a declaration of WCAG conformance. */
export const ACCESSIBILITY_REVIEW = {
  date: '2026-10-15',
  label: '15 October 2026',
  target: 'WCAG 2.2 Level AA',
};

export const ACCESSIBILITY_SAMPLE = [
  { path: '/', label: 'Coming soon', title: 'GOV.PH' },
  { path: '/home', label: 'Home', title: 'GOV.PH' },
  { path: '/services', label: 'Services', title: 'Government Services' },
  {
    path: '/government',
    label: 'Government directory',
    title: 'Government Directory',
  },
  { path: '/search', label: 'Search', title: 'Search' },
  { path: '/contact', label: 'Contact', title: 'Contact' },
  { path: '/about', label: 'About', title: 'About' },
  { path: '/accessibility', label: 'Accessibility', title: 'Accessibility' },
  {
    path: '/design/accessibility',
    label: 'Design accessibility',
    title: 'Accessibility',
  },
];

export type AccessibilityStatus = 'supported' | 'improve' | 'unverified';

type ChecklistItem = {
  id: string;
  title: string;
  detail: string;
  next?: string;
};

type ChecklistGroup = {
  id: AccessibilityStatus;
  label: string;
  description: string;
  items: ChecklistItem[];
};

export const ACCESSIBILITY_CHECKLIST: ChecklistGroup[] = [
  {
    id: 'supported',
    label: 'Supported in the pages tested',
    description:
      'These checks passed in the review below. Each result has a limited scope; it does not establish accessibility across the whole website.',
    items: [
      {
        id: 'page-identification',
        title: 'Page titles and an English language declaration',
        detail:
          'The nine sampled pages have a page title, one main heading, and an English document language. Language changes and translated content still need review.',
      },
      {
        id: 'search-labels',
        title: 'Named search fields',
        detail:
          'Visible search fields on the sampled pages have accessible names, so their purpose does not depend on placeholder text alone. This check does not cover search results or error announcements.',
      },
      {
        id: 'image-alternatives',
        title: 'Image alternative-text markup',
        detail:
          'Images in the sampled page states have an alt attribute. Human review is still needed to judge whether each description is useful or an image should be decorative.',
      },
      {
        id: 'narrow-layout',
        title: 'Layouts that fit narrow screens',
        detail:
          'The sampled pages fit 320 and 720 CSS-pixel viewports without page-level horizontal scrolling. Wide directory tables scroll within their own area. Browser zoom and text resizing are separate checks still to do.',
      },
    ],
  },
  {
    id: 'improve',
    label: 'What we need to improve',
    description:
      'Testing or code review found these barriers. The boxes stay open until the fixes have been checked.',
    items: [
      {
        id: 'contrast',
        title: 'Readable contrast throughout the site',
        detail:
          'Automated checks found low-contrast text on the home and services pages, including secondary labels and counts.',
        next: 'Meet at least 4.5:1 for normal text and 3:1 for large text; also review controls, focus indicators, and content the checker could not assess.',
      },
      {
        id: 'structure',
        title: 'Consistent headings, landmarks, and table labels',
        detail:
          'The government directory is missing a main landmark and has an empty table header. Checks also found heading-order gaps and a nested landmark on other sampled pages.',
        next: 'Give every page a clear main region, a logical heading hierarchy, and meaningful table headers.',
      },
      {
        id: 'link-identification',
        title: 'Links identifiable without colour alone',
        detail:
          'The departments-directory link in the contact page relies on colour to stand out from surrounding text.',
        next: 'Underline links within prose or provide another persistent visual cue.',
      },
      {
        id: 'keyboard',
        title: 'Complete keyboard navigation',
        detail:
          'There is no working skip-to-content link. The services search field lacks a visible focus indicator, and Escape does not close the mobile navigation.',
        next: 'Add a working skip link, visible focus, and reliable menu focus handling; then check complete tasks, including the chatbot, without a mouse.',
      },
      {
        id: 'motion',
        title: 'Respect reduced-motion preferences',
        detail:
          'Home-page entrance animations are still enabled when the browser requests reduced motion.',
        next: 'Reduce nonessential animation and smooth scrolling, and review automatically changing content for pause controls.',
      },
    ],
  },
  {
    id: 'unverified',
    label: 'What we still need to verify',
    description:
      'These are goals for further testing. We have not marked them as supported.',
    items: [
      {
        id: 'assistive-technology',
        title: 'Screen-reader and voice-control journeys',
        detail:
          'Test real tasks with NVDA, VoiceOver, TalkBack, and voice control, including menus, filters, search results, and chatbot responses. Include people who use these tools every day.',
      },
      {
        id: 'zoom-spacing',
        title: 'Text resizing, browser zoom, and text spacing',
        detail:
          'Check 200% text resizing, 400% browser zoom, and custom text spacing for clipped content, overlap, and controls that become hard to reach.',
      },
      {
        id: 'touch-targets',
        title: 'Comfortable touch targets',
        detail:
          'Review target sizes and spacing against WCAG 2.2 AA, including the 24 × 24 CSS-pixel target-size criterion and its exceptions. Aim for 44 × 44 CSS pixels for primary controls.',
      },
      {
        id: 'languages',
        title: 'Plain language and Filipino coverage',
        detail:
          'Review clarity, translation coverage, and correct language announcements when switching between English and Filipino. This checklist is currently in English.',
      },
      {
        id: 'complete-journeys',
        title: 'Dynamic content and complete service journeys',
        detail:
          'Test loaded search results, validation errors, loading and offline states, maps, and every stage of key tasks. The current automated sample covers default page states only.',
      },
      {
        id: 'documents-media',
        title: 'Documents, media, and linked agency services',
        detail:
          'Review PDFs, captions and transcripts, image-description quality, and services hosted on agency websites. The current review does not cover those resources.',
      },
    ],
  },
];
