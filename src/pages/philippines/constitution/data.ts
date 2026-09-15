import { ConstitutionVersionSchema, type ConstitutionVersion } from './schema';
import { fullText1987 } from './versions/fullText1987';
import { fullText1986 } from './versions/fullText1986';
import { fullText1973 } from './versions/fullText1973';
import { fullText1943 } from './versions/fullText1943';
import { fullText1935 } from './versions/fullText1935';
import { fullText1916 } from './versions/fullText1916';
import { fullText1902 } from './versions/fullText1902';
import { fullText1899 } from './versions/fullText1899';

// Ordered newest-first: the constitution currently in force appears at the
// top, followed by earlier charters in reverse chronological order.
const rawData: ConstitutionVersion[] = [
  {
    slug: '1987-constitution',
    name: 'The 1987 Constitution of the Republic of the Philippines',
    shortName: '1987 Constitution',
    year: 1987,
    effectiveDate: 'February 2, 1987',
    status: 'in-force',
    period: 'Present-day Fifth Republic',
    summary:
      'Drafted by a Constitutional Commission and ratified by plebiscite on February 2, 1987, this is the current and longest-serving written constitution of the Philippines. It restored the presidential, bicameral system, added safeguards against the abuses of Martial Law, and remains in force today without amendment.',
    formOfGovernment: 'Presidential, democratic republic',
    branchStructure:
      'Restored a bicameral Congress (Senate and House of Representatives), an independently elected President limited to a single six-year term, and an independent judiciary, alongside constitutional commissions (COA, COMELEC, CSC) and a Commission on Human Rights.',
    rights:
      'An expanded Bill of Rights plus a separate article on Social Justice and Human Rights; limits the declaration of Martial Law and subjects it to congressional and judicial review; affirms civilian supremacy over the military.',
    keyChanges: [
      'Restored the presidential system with a single, non-renewable six-year presidential term',
      'Added explicit safeguards limiting the declaration and duration of Martial Law',
      'Created new independent bodies, including the Commission on Human Rights',
      'Added an Article on Social Justice and Human Rights not present in earlier charters',
      'Remains in force today; per the Constitute Project it is counted as the Philippines\u2019 sixth constitution and has not been formally amended since ratification',
    ],
    sourceUrl: 'https://www.officialgazette.gov.ph/constitutions/',
    fullText: fullText1987,
  },
  {
    slug: 'freedom-constitution-1986',
    name: 'The 1986 Freedom Constitution',
    shortName: '1986 Freedom Constitution',
    year: 1986,
    effectiveDate: 'March 25, 1986',
    endDate: 'February 2, 1987',
    status: 'interim',
    period: 'Post-EDSA transitional period',
    summary:
      'Promulgated by President Corazon Aquino through Proclamation No. 3 after the People Power Revolution ousted President Marcos, this provisional charter abolished the 1973 Constitution\u2019s Batasang Pambansa, granted the President broad reorganizing powers, and governed the country while a new permanent constitution was drafted.',
    formOfGovernment: 'Revolutionary transitional government',
    branchStructure:
      'Concentrated legislative and executive power in the President pending the convening of a new legislature; retained the judiciary and provided for a Constitutional Commission to draft a permanent charter.',
    rights:
      'Adopted the Bill of Rights of the 1973 Constitution while the President exercised extraordinary powers to reorganize government.',
    keyChanges: [
      'Abolished the Batasang Pambansa (the 1973 Constitution\u2019s legislature)',
      'Granted President Aquino power to reorganize the entire government, including removing officials',
      'Created the mechanism (a Constitutional Commission) that produced the 1987 Constitution',
      'Served as a deliberately temporary, provisional charter',
    ],
    sourceUrl: 'https://www.officialgazette.gov.ph/constitutions/',
    fullText: fullText1986,
  },
  {
    slug: '1973-constitution',
    name: 'The 1973 Constitution',
    shortName: '1973 Constitution',
    year: 1973,
    effectiveDate: 'January 17, 1973',
    endDate: 'February 1986 (Freedom Constitution)',
    status: 'superseded',
    period: 'Martial Law era under President Marcos',
    summary:
      'Drafted by the 1971 Constitutional Convention and proclaimed in force by President Ferdinand Marcos after being deemed ratified by Citizens\u2019 Assemblies in January 1973, this charter replaced the presidential system with a parliamentary-style government and was repeatedly amended during Martial Law to extend and consolidate Marcos\u2019s rule.',
    formOfGovernment:
      'Parliamentary-style republic (as amended, increasingly authoritarian in practice)',
    branchStructure:
      'Originally a unicameral National Assembly electing a Prime Minister as head of government, with a largely ceremonial President; later amendments restored strong presidential powers under Marcos while keeping the National Assembly (renamed the Batasang Pambansa).',
    rights:
      'Retained a Bill of Rights but its protections were extensively curtailed in practice through Martial Law decrees and the President\u2019s legislative powers.',
    keyChanges: [
      'Replaced the presidential system of the 1935 Constitution with a parliamentary-style government',
      'Allowed President Marcos to continue holding power past the two-term limit of the 1935 Constitution',
      'Granted the President broad legislative powers through decrees during Martial Law',
      'Repeatedly amended (1976, 1980, 1981, 1984) to reshape the structure of government and entrench executive power',
    ],
    sourceUrl: 'https://www.officialgazette.gov.ph/constitutions/',
    fullText: fullText1973,
  },
  {
    slug: '1943-constitution',
    name: 'The 1943 Constitution',
    shortName: '1943 Constitution',
    year: 1943,
    effectiveDate: 'September 1943',
    endDate: '1945',
    status: 'never-implemented',
    period: 'Japanese Occupation',
    summary:
      'Approved by a Preparatory Committee and ratified by the KALIBAPI Convention during the Japanese Occupation, this charter established the Japanese-sponsored Second Republic under President Jose P. Laurel. It was never recognized by the wartime Commonwealth government-in-exile and lapsed with Japan\u2019s defeat in 1945.',
    formOfGovernment: 'Japanese-sponsored wartime republic',
    branchStructure:
      'A strongly centralized presidency with a National Assembly largely subordinate to executive authority, reflecting wartime emergency conditions.',
    rights:
      'Civil liberties were nominally provided for but severely constrained in practice under wartime military occupation.',
    keyChanges: [
      'Created during Japanese military occupation and never accepted as legitimate by the exiled Commonwealth government',
      'Concentrated power heavily in the presidency',
      'Lapsed automatically with Japan\u2019s surrender and the restoration of the Commonwealth in 1945',
    ],
    sourceUrl: 'https://www.officialgazette.gov.ph/constitutions/',
    fullText: fullText1943,
  },
  {
    slug: '1935-constitution',
    name: 'The 1935 Constitution',
    shortName: '1935 Constitution',
    year: 1935,
    effectiveDate: 'May 14, 1935 (ratified by plebiscite)',
    endDate: 'January 17, 1973',
    status: 'superseded',
    period: 'Commonwealth and early independence period',
    summary:
      'Approved by the 1934 Constitutional Convention, certified by the U.S. President, and ratified by plebiscite, this charter established the Commonwealth of the Philippines as a transition to full independence, and continued to govern the Republic after independence in 1946 until 1973. It was amended in 1940 and 1947.',
    formOfGovernment:
      'Commonwealth transitioning to independent presidential republic',
    branchStructure:
      'Originally a unicameral National Assembly; the 1940 amendments introduced a bicameral Congress (Senate and House) and changed the presidential term from six years (no re-election) to four years (with one re-election).',
    rights:
      'A Bill of Rights modeled closely on the U.S. Constitution, guaranteeing due process, equal protection, and civil liberties; required uniform taxation.',
    keyChanges: [
      'Established the Commonwealth government as the framework for transition to full independence in 1946',
      '1940 amendments converted the legislature from unicameral to bicameral and created an independent Commission on Elections',
      '1940 amendments shortened the presidential term to four years but allowed one re-election',
      '1947 "Parity Amendment" granted U.S. citizens equal rights with Filipinos to exploit Philippine natural resources',
    ],
    sourceUrl: 'https://www.officialgazette.gov.ph/constitutions/',
    fullText: fullText1935,
  },
  {
    slug: 'jones-law-1916',
    name: 'The Jones Law of 1916',
    shortName: 'Jones Law of 1916',
    year: 1916,
    effectiveDate: 'August 29, 1916',
    endDate: '1935',
    status: 'superseded',
    period: 'American colonial period',
    summary:
      'Also known as the Philippine Autonomy Act, this law replaced the 1902 Organic Act and contained the first formal U.S. pledge of eventual Philippine independence, while expanding Filipino self-government.',
    formOfGovernment: 'American colonial administration with expanded autonomy',
    branchStructure:
      'Replaced the appointed Philippine Commission with a fully elected, bicameral Philippine Legislature (Senate and House of Representatives); the Governor-General retained executive power.',
    rights:
      'Carried forward and elaborated the civil liberties guarantees of the 1902 Organic Act.',
    keyChanges: [
      'First U.S. law to formally pledge eventual Philippine independence',
      'Replaced the appointed Philippine Commission with an elected, bicameral Legislature',
      'Significantly expanded Filipino participation in lawmaking',
    ],
    sourceUrl: 'https://www.officialgazette.gov.ph/constitutions/',
    fullText: fullText1916,
  },
  {
    slug: 'organic-act-1902',
    name: 'The Philippine Organic Act of 1902',
    shortName: 'Organic Act of 1902',
    year: 1902,
    effectiveDate: 'July 1, 1902',
    endDate: '1916',
    status: 'superseded',
    period: 'American colonial period',
    summary:
      'Enacted by the United States Congress, this organic act served as the basic law for the Philippine Islands under American administration, replacing the short-lived Malolos Republic with a colonial government.',
    formOfGovernment: 'American colonial administration',
    branchStructure:
      'A Governor-General appointed by the U.S. President, an appointed Philippine Commission, and a Philippine Assembly composed of elected Filipino representatives created under this Act.',
    rights:
      'Extended a U.S. Bill-of-Rights-style charter of civil liberties to Filipinos, though without full self-governance.',
    keyChanges: [
      'Replaced the Malolos Republic with direct American colonial governance',
      'Created the first elected Philippine Assembly',
      'Extended American constitutional civil liberties protections to Filipinos',
    ],
    sourceUrl: 'https://www.officialgazette.gov.ph/constitutions/',
    fullText: fullText1902,
  },
  {
    slug: 'malolos-1899',
    name: 'The 1899 Malolos Constitution',
    shortName: '1899 Malolos Constitution',
    year: 1899,
    effectiveDate: 'January 21, 1899',
    endDate: 'March 23, 1901',
    status: 'superseded',
    period: 'First Philippine Republic',
    summary:
      'Drafted by the Malolos Congress and approved on November 29, 1898, this was the first republican constitution in Asia. It established the First Philippine Republic under President Emilio Aguinaldo, ending with his capture by American forces in 1901.',
    formOfGovernment: 'Unitary republic, popular sovereignty',
    branchStructure:
      'A dominant unicameral Assembly of Representatives, with a weaker executive (President and Cabinet) accountable to it, and a separate judiciary.',
    rights:
      'Guaranteed civil liberties including freedom of expression, association, and religion, due process protections, and barred taxation without legislative consent.',
    keyChanges: [
      'First written constitution of the Philippines and the first republican charter in Asia',
      'Established separation of powers with a strong legislature',
      'Declared Catholicism the state religion while guaranteeing free exercise of other faiths',
    ],
    sourceUrl: 'https://www.officialgazette.gov.ph/constitutions/',
    fullText: fullText1899,
  },
];

export const constitutionVersions: ConstitutionVersion[] =
  ConstitutionVersionSchema.array().parse(rawData);
