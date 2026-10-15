/**
 * The President and the Vice President, for their profile pages under
 * /government/executive. Unlike the office directories (executive.json),
 * these are short sourced profiles: every fact cites an entry in `sources`
 * by its 1-based number, and `verifiedOn` is the date the whole profile was
 * last checked. Re-check the VP's `notice` whenever the impeachment trial
 * moves; it is dated on purpose.
 */

export type ExecutiveHeadSlug = 'president' | 'vice-president';

/** 1-based indexes into `sources`. */
type Cite = number[];

export type ExecutiveHeadSource = {
  /** Describes the source; not necessarily the page's own headline. */
  title: string;
  publisher: string;
  url: string;
  /** Publication date, or the retrieval date for undated pages. */
  date?: string;
};

export type ExecutiveHead = {
  slug: ExecutiveHeadSlug;
  counterpart: ExecutiveHeadSlug;
  title: string;
  shortTitle: string;
  ordinal: string;
  name: string;
  fullName: string;
  lede: string;
  ledeCite: Cite;
  portrait: {
    src: string;
    /** Head-and-shoulders crop for small cards. */
    thumb: string;
    width: number;
    height: number;
    alt: string;
    credit: string;
    license: string;
    sourceUrl: string;
  };
  keyFacts: { label: string; value: string; cite: Cite }[];
  notice?: { heading: string; text: string; cite: Cite };
  role: { text: string; cite: Cite }[];
  profile: { label: string; value: string; cite: Cite }[];
  career: { period: string; office: string; cite: Cite }[];
  /** Slug of the office's staff directory in executive.json. */
  officeSlug: string;
  officeName: string;
  channels: { label: string; url: string }[];
  sources: ExecutiveHeadSource[];
  verifiedOn: string;
};

const CONSTITUTION: ExecutiveHeadSource = {
  title: 'The 1987 Constitution of the Republic of the Philippines',
  publisher: 'Official Gazette',
  url: 'https://www.officialgazette.gov.ph/constitutions/1987-constitution/',
};

const PROCLAMATION_2022: ExecutiveHeadSource = {
  title:
    'Congress proclaims the winners of the 2022 presidential and vice-presidential elections',
  publisher: 'ABS-CBN News',
  url: 'https://news.abs-cbn.com/news/05/25/22/marcos-duterte-carpio-proclaimed-duly-elected-president-vp',
  date: '2022-05-25',
};

const president: ExecutiveHead = {
  slug: 'president',
  counterpart: 'vice-president',
  title: 'President of the Philippines',
  shortTitle: 'The President',
  ordinal: '17th President',
  name: 'Ferdinand R. Marcos Jr.',
  fullName: 'Ferdinand Romualdez Marcos Jr.',
  lede: 'Ferdinand R. Marcos Jr. is the 17th President of the Republic of the Philippines. Elected on 9 May 2022, he took office at noon on 30 June 2022 for a single six-year term that ends at noon on 30 June 2028.',
  ledeCite: [2, 1, 8],
  portrait: {
    src: '/images/officials/president.jpg',
    thumb: '/images/officials/president-thumb.jpg',
    width: 640,
    height: 1037,
    alt: 'Official portrait of President Ferdinand R. Marcos Jr., standing before the Philippine flag and the Seal of the President',
    credit: 'Official portrait, Office of the President',
    license: 'Public domain, via Wikimedia Commons',
    sourceUrl:
      'https://commons.wikimedia.org/wiki/File:Ferdinand_R._Marcos_Jr.jpg',
  },
  keyFacts: [
    { label: 'In office since', value: '30 June 2022', cite: [1, 2] },
    { label: 'Term ends', value: '30 June 2028', cite: [1] },
    { label: 'Votes in 2022', value: '31,629,783', cite: [2] },
  ],
  role: [
    {
      text: 'Holds the executive power, and has control of all executive departments, bureaus and offices to ensure that the laws are faithfully executed (Article VII, Sections 1 and 17).',
      cite: [1],
    },
    {
      text: 'Is Commander-in-Chief of all armed forces of the Philippines (Article VII, Section 18).',
      cite: [1],
    },
    {
      text: 'Nominates and, with the consent of the Commission on Appointments, appoints the heads of executive departments, ambassadors, and senior officers of the armed forces (Article VII, Section 16).',
      cite: [1],
    },
    {
      text: 'May grant reprieves, commutations and pardons, except in cases of impeachment (Article VII, Section 19).',
      cite: [1],
    },
    {
      text: 'Is elected by direct vote of the people for a six-year term and is not eligible for reelection (Article VII, Section 4).',
      cite: [1],
    },
    {
      text: 'Must be a natural-born citizen, a registered voter, able to read and write, at least 40 years old on election day, and a resident of the Philippines for at least ten years before the election (Article VII, Section 2).',
      cite: [1],
    },
  ],
  profile: [
    { label: 'Full name', value: 'Ferdinand Romualdez Marcos Jr.', cite: [2] },
    { label: 'Born', value: '13 September 1957', cite: [4] },
    {
      label: 'Proclaimed',
      value:
        '25 May 2022, by Congress sitting as the National Board of Canvassers',
      cite: [2, 7],
    },
    {
      label: 'Oath of office',
      value:
        '30 June 2022, at the National Museum in Manila, before Chief Justice Alexander Gesmundo',
      cite: [3],
    },
    {
      label: 'Elected under',
      value: 'Partido Federal ng Pilipinas (PFP)',
      cite: [7],
    },
  ],
  career: [
    {
      period: '2022 – present',
      office: 'President of the Philippines',
      cite: [2],
    },
    {
      period: '2022 – 2023',
      office:
        'Secretary of Agriculture, concurrently with the presidency (30 June 2022 to 3 November 2023)',
      cite: [6],
    },
    { period: '2010 – 2016', office: 'Senator', cite: [5] },
    {
      period: '2007 – 2010',
      office: 'Representative, 2nd District of Ilocos Norte',
      cite: [5],
    },
    { period: '1998 – 2007', office: 'Governor of Ilocos Norte', cite: [5] },
    {
      period: '1992 – 1995',
      office: 'Representative, 2nd District of Ilocos Norte',
      cite: [5],
    },
    { period: '1983 – 1986', office: 'Governor of Ilocos Norte', cite: [5] },
    {
      period: '1980 – 1983',
      office: 'Vice Governor of Ilocos Norte',
      cite: [5],
    },
  ],
  officeSlug: 'office-of-the-president',
  officeName: 'Office of the President',
  channels: [
    { label: 'Presidential Communications Office', url: 'pco.gov.ph' },
    { label: 'Office of the President', url: 'op-proper.gov.ph' },
    { label: 'Official Gazette', url: 'www.officialgazette.gov.ph' },
  ],
  sources: [
    CONSTITUTION,
    PROCLAMATION_2022,
    {
      title: 'Report on the inauguration of President Marcos',
      publisher: 'GMA News',
      url: 'https://www.gmanetwork.com/news/topstories/nation/836715/bible-in-bongbong-s-inauguration-same-one-used-by-marcos-sr-in-1965/story/',
      date: '2022-07-01',
    },
    {
      title: 'Official biography of the President',
      publisher: 'Embassy of the Philippines in Tokyo',
      url: 'https://tokyo.philembassy.net/the-philippine-president/ferdinand-romualdez-marcos-jr/',
      date: '2026-10-15',
    },
    {
      title: 'The President: official biography',
      publisher: 'Embassy of the Philippines in Wellington',
      url: 'https://philembassy.org.nz/about/the-president',
      date: '2026-10-15',
    },
    {
      title: 'History of the Department of Agriculture',
      publisher: 'Department of Agriculture',
      url: 'https://www.da.gov.ph/about-us/history/',
      date: '2026-10-15',
    },
    {
      title: 'Report on the 2022 proclamation and official canvass',
      publisher: 'GMA News',
      url: 'https://www.gmanetwork.com/news/topstories/nation/832829/bongbong-marcos-proclaimed-president-sara-duterte-vice-president/story/',
      date: '2022-05-25',
    },
    {
      title: 'News release on the President’s activities',
      publisher: 'Presidential Communications Office',
      url: 'https://pco.gov.ph/news_releases/president-marcos-leads-launch-of-seven-dole-flagship-innovations-to-boost-jobs-livelihood-opportunities/',
      date: '2026-10-14',
    },
  ],
  verifiedOn: '2026-10-15',
};

const vicePresident: ExecutiveHead = {
  slug: 'vice-president',
  counterpart: 'president',
  title: 'Vice President of the Philippines',
  shortTitle: 'The Vice President',
  ordinal: '15th Vice President',
  name: 'Sara Z. Duterte',
  fullName: 'Sara Zimmerman Duterte',
  lede: 'Sara Z. Duterte is the 15th Vice President of the Republic of the Philippines. Elected on 9 May 2022, she took office at noon on 30 June 2022 for a six-year term that ends at noon on 30 June 2028.',
  ledeCite: [2, 1, 5],
  portrait: {
    src: '/images/officials/vice-president.jpg',
    thumb: '/images/officials/vice-president-thumb.jpg',
    width: 640,
    height: 1037,
    alt: 'Official portrait of Vice President Sara Z. Duterte, standing before the Philippine flag and the Seal of the Vice President',
    credit: 'Official portrait, Office of the Vice President',
    license: 'Public domain, via Wikimedia Commons',
    sourceUrl:
      'https://commons.wikimedia.org/wiki/File:VPSD_Official_Photo.jpg',
  },
  keyFacts: [
    { label: 'In office since', value: '30 June 2022', cite: [1, 2] },
    { label: 'Term ends', value: '30 June 2028', cite: [1] },
    { label: 'Votes in 2022', value: '32,208,417', cite: [2] },
  ],
  notice: {
    heading: 'Impeachment trial in progress · as of 15 October 2026',
    text: 'The House of Representatives impeached the Vice President on 11 May 2026, and the Senate, sitting as an impeachment court, opened the trial on 6 July 2026. On 13 October 2026 the prosecution withdrew three of the four articles of impeachment and is proceeding on Article II only; the trial resumes on 9 November 2026. An earlier impeachment, transmitted to the Senate in February 2025, was declared unconstitutional by the Supreme Court on 25 July 2025. The Vice President remains in office while the trial is pending.',
    cite: [7, 9, 10, 8, 5],
  },
  role: [
    {
      text: 'Has the same qualifications and term of office as the President, and is elected with and in the same manner as the President (Article VII, Section 3).',
      cite: [1],
    },
    {
      text: 'May be appointed as a Member of the Cabinet; such an appointment requires no confirmation (Article VII, Section 3).',
      cite: [1],
    },
    {
      text: 'Becomes President for the unexpired term if the President dies, is permanently disabled, is removed from office, or resigns (Article VII, Section 8).',
      cite: [1],
    },
    {
      text: 'May serve no more than two consecutive terms (Article VII, Section 4).',
      cite: [1],
    },
    {
      text: 'Like the President, may be removed from office only on impeachment and conviction (Article XI, Section 2).',
      cite: [1],
    },
  ],
  profile: [
    { label: 'Full name', value: 'Sara Zimmerman Duterte', cite: [2, 4] },
    { label: 'Born', value: '31 May 1978', cite: [2] },
    {
      label: 'Proclaimed',
      value:
        '25 May 2022, by Congress sitting as the National Board of Canvassers',
      cite: [2],
    },
    {
      label: 'Oath of office',
      value:
        '19 June 2022, at San Pedro Square in Davao City, before Associate Justice Ramon Paul Hernando; assumed office at noon on 30 June 2022',
      cite: [3],
    },
    { label: 'Elected under', value: 'Lakas–CMD', cite: [11] },
  ],
  career: [
    {
      period: '2022 – present',
      office: 'Vice President of the Philippines',
      cite: [2],
    },
    {
      period: '2022 – 2024',
      office:
        'Secretary of Education, concurrently with the vice presidency (until 19 July 2024)',
      cite: [4, 6],
    },
    { period: '2016 – 2022', office: 'Mayor of Davao City', cite: [4] },
    { period: '2010 – 2013', office: 'Mayor of Davao City', cite: [4] },
    { period: '2007 – 2010', office: 'Vice Mayor of Davao City', cite: [4] },
    {
      period: '2006',
      office: 'Court Attorney, Supreme Court of the Philippines',
      cite: [4],
    },
  ],
  officeSlug: 'office-of-the-vice-president',
  officeName: 'Office of the Vice President',
  channels: [
    { label: 'Office of the Vice President', url: 'www.ovp.gov.ph' },
    {
      label: 'Facebook',
      url: 'https://www.facebook.com/OfficeOfTheVicePresidentPH/',
    },
    { label: 'YouTube', url: 'https://www.youtube.com/@OVP_PH' },
  ],
  sources: [
    CONSTITUTION,
    PROCLAMATION_2022,
    {
      title: 'Report on the Vice President’s oath-taking',
      publisher: 'GMA News',
      url: 'https://www.gmanetwork.com/news/topstories/nation/835403/sara-duterte-takes-oath-as-philippines-15th-vice-president/story/',
      date: '2022-06-19',
    },
    {
      title: 'The Vice President: biography',
      publisher: 'Office of the Vice President',
      url: 'https://www.ovp.gov.ph/thevicepresident',
      date: '2026-10-15',
    },
    {
      title: 'Statement of the Vice President, 13 October 2026',
      publisher: 'Office of the Vice President',
      url: 'https://www.ovp.gov.ph/post/pahayag-13-october-2026',
      date: '2026-10-13',
    },
    {
      title:
        'Report on the Vice President’s resignation from the Department of Education',
      publisher: 'GMA News',
      url: 'https://www.gmanetwork.com/news/topstories/nation/910976/vp-sara-duterte-says-she-remains-friendly-with-marcos-resignation-in-deped-s-best-interest/story/',
      date: '2024-06-23',
    },
    {
      title: 'Report on the House vote to impeach the Vice President',
      publisher: 'GMA News',
      url: 'https://www.gmanetwork.com/news/topstories/nation/987211/vice-president-sara-duterte-impeached-by-house-of-representatives/story/',
      date: '2026-05-11',
    },
    {
      title: 'Press briefer on Duterte v. House of Representatives',
      publisher: 'Supreme Court of the Philippines',
      url: 'https://sc.judiciary.gov.ph/wp-content/uploads/2026/01/PRESS-BRIEFER-January-29-2026.pdf',
      date: '2026-01-29',
    },
    {
      title: 'Report on the withdrawal of three articles of impeachment',
      publisher: 'GMA News',
      url: 'https://www.gmanetwork.com/news/topstories/nation/1005740/prosecution-drops-3-articles-retains-article-ii-in-sara-duterte-impeachment-trial/story/',
      date: '2026-10-13',
    },
    {
      title: 'Report on the adjournment of the impeachment trial',
      publisher: 'The Manila Times',
      url: 'https://www.manilatimes.net/2026/10/14/news/duterte-impeachment-trial-adjourned-until-nov-9/2445120',
      date: '2026-10-14',
    },
    {
      title: '2022 national election results (Open Halalan dataset)',
      publisher: 'Dynasties by BetterGov.ph',
      url: 'https://dynasties.bettergov.ph/api/v1/national/2022',
      date: '2026-10-15',
    },
  ],
  verifiedOn: '2026-10-15',
};

export const executiveHeads: Record<ExecutiveHeadSlug, ExecutiveHead> = {
  president,
  'vice-president': vicePresident,
};
