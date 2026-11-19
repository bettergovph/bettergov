import type { HeritageImage } from '../components/v2/heritage/Heritage';

export const heritageImages: Record<string, HeritageImage> = {
  sinulog: {
    name: 'sinulog',
    alt: 'Sinulog dancers in red and gold holding Santo Niño images in Cebu in 2014',
    caption: 'Sinulog, Cebu · 2014',
    creator: 'Jescario',
    source: 'https://commons.wikimedia.org/wiki/File:Sinulog_2014_01.JPG',
    license: 'CC0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
  },
  terraces: {
    name: 'terraces',
    alt: 'Green rice terraces following the mountain slopes near Banaue, Ifugao',
    caption: 'Rice terraces near Banaue, Ifugao',
    creator: 'John.and.Steven',
    source:
      'https://commons.wikimedia.org/wiki/File:Rice_Terraces_near_Banaue.jpg',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
  },
  weaving: {
    name: 'weaving',
    alt: 'A T’boli artisan weaving t’nalak on a backstrap loom at Lake Sebu, South Cotabato',
    caption: 'T’nalak weaving, Lake Sebu · 2014',
    creator: 'I Travel Philippines',
    creatorUrl: 'https://wayph.com/',
    source:
      'https://commons.wikimedia.org/wiki/File:T%27nalak_weaver_at_Lake_Sebu,_South_Cotabato.jpg',
    license: 'CC BY 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.0/',
  },
  adobo: {
    name: 'adobo',
    alt: 'A plate of chicken and pork adobo in a dark sauce',
    caption: 'Chicken and pork adobo',
    creator: 'dbgg1979',
    source: 'https://commons.wikimedia.org/wiki/File:Chicken_adobo.jpg',
    license: 'CC BY 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.0/',
  },
};

export const cultureSources = {
  languages: {
    title: 'KWF · Atlas ng mga Wika ng Filipinas',
    url: 'https://kwf.gov.ph/wp-content/uploads/2017/03/DF2.pdf',
  },
  constitution: {
    title: '1987 Constitution · Language and religious freedom',
    url: 'https://lawphil.net/consti/cons1987.html',
  },
  cebu: {
    title: 'Department of Tourism · Cebu and Sinulog',
    url: 'https://philippines.travel/destinations/cebu-city/index',
  },
  davao: {
    title: 'Department of Tourism · Kadayawan',
    url: 'https://philippines.travel/activities/kadayawan-festival/index',
  },
  food: {
    title: 'National Museum · Pagkaing Filipino',
    url: 'https://www.nationalmuseum.gov.ph/exhibitions/nm-ilocos-regional-museum-complex/pagkaing-filipino/',
  },
  pina: {
    title: 'UNESCO · Aklan piña handloom weaving',
    url: 'https://ich.unesco.org/en/RL/aklan-pina-handloom-weaving-01564',
  },
  hudhud: {
    title: 'UNESCO · Hudhud chants of the Ifugao',
    url: 'https://ich.unesco.org/en/RL/hudhud-chants-of-the-ifugao-00015',
  },
  darangen: {
    title: 'UNESCO · Darangen epic of the Maranao',
    url: 'https://ich.unesco.org/en/RL/darangen-epic-of-the-maranao-people-of-lake-lanao-00159',
  },
};

export const historySources = {
  archaeology: {
    title: 'National Museum · Archaeological research',
    url: 'https://www.nationalmuseum.gov.ph/our-collections/archaeology/archeology-division-history/',
  },
  sourcebook: {
    title: 'NCCA · Readings in Philippine History (PDF)',
    url: 'https://ncca.gov.ph/wp-content/uploads/2021/09/PHILIPPINE-HISTORY-SOURCE-BOOK-FINAL-SEP022021.pdf',
  },
  independence: {
    title: 'NHCP · Proclamation of Philippine independence',
    url: 'https://philhistoricsites.nhcp.gov.ph/registry_database/site-of-the-proclamation-of-philippine-independence/',
  },
  american: {
    title: 'U.S. House of Representatives · The Philippines, 1898–1946',
    url: 'https://history.house.gov/Exhibitions-and-Publications/APA/Historical-Essays/Exclusion-and-Empire/The-Philippines/',
  },
  proclamation1081: {
    title: 'Proclamation No. 1081 · 1972',
    url: 'https://lawphil.net/executive/proc/proc1972/proc_1081_1972.html',
  },
  proclamation2045: {
    title: 'Proclamation No. 2045 · 1981',
    url: 'https://lawphil.net/executive/proc/proc1981/proc_2045_1981.html',
  },
  recognition: {
    title: 'Republic Act No. 10368 · Recognition and reparation',
    url: 'https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/2/52724',
  },
  constitution: {
    title: '1987 Constitution',
    url: 'https://lawphil.net/consti/cons1987.html',
  },
  localGovernment: {
    title: 'Republic Act No. 7160 · Local Government Code',
    url: 'https://lawphil.net/statutes/repacts/ra1991/ra_7160_1991.html',
  },
  bangsamoro: {
    title: 'Republic Act No. 11054 · Bangsamoro Organic Law',
    url: 'https://lawphil.net/statutes/repacts/ra2018/ra_11054_2018.html',
  },
};

export type HistorySourceId = keyof typeof historySources;
