// SEO data generators for government pages

export interface GovernmentSEOData {
  title: string;
  description: string;
  keywords: string[];
  canonical: string;
  jsonLd?: object;
  breadcrumbs?: Array<{
    name: string;
    url: string;
  }>;
}

const baseKeywords = [
  'Philippines',
  'Philippine Government',
  'Government Services',
  'Republic of the Philippines',
  'Official Government Portal',
];

export function getExecutiveSEOData(officeName?: string): GovernmentSEOData {
  const baseTitle = 'Executive Branch';
  const title = officeName ? `${officeName} - ${baseTitle}` : baseTitle;

  return {
    title,
    description: officeName
      ? `Contact information and details for ${officeName}. A directory of the Philippine Executive Branch.`
      : 'A directory of the Philippine Executive Branch including the Office of the President, Vice President, and other executive offices.',
    keywords: [
      ...baseKeywords,
      'Executive Branch',
      'President of the Philippines',
      'Vice President',
      'Executive Offices',
      'Presidential Communications',
      ...(officeName ? [officeName] : []),
    ],
    canonical: officeName
      ? `/government/executive/${encodeURIComponent(
          officeName.toLowerCase().replace(/\s+/g, '-')
        )}`
      : '/government/executive',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Government', url: '/government' },
      { name: 'Executive Branch', url: '/government/executive' },
      ...(officeName
        ? [
            {
              name: officeName,
              url: `/government/executive/${encodeURIComponent(
                officeName.toLowerCase().replace(/\s+/g, '-')
              )}`,
            },
          ]
        : []),
    ],
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'GovernmentOrganization',
      name: officeName || 'Philippine Executive Branch',
      url: `https://gov.ph/government/executive${
        officeName
          ? `/${encodeURIComponent(
              officeName.toLowerCase().replace(/\s+/g, '-')
            )}`
          : ''
      }`,
      description: officeName
        ? `${officeName} - Philippine Executive Branch`
        : 'A directory of the Philippine Executive Branch',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'PH',
        addressLocality: 'Manila',
      },
    },
  };
}

export function getDepartmentsSEOData(
  departmentName?: string
): GovernmentSEOData {
  const baseTitle = 'Government Departments';
  const title = departmentName
    ? `${departmentName.replace('DEPARTMENT OF ', '')} - ${baseTitle}`
    : baseTitle;

  return {
    title,
    description: departmentName
      ? `Contact information, services, and details for the ${departmentName}. A government department directory.`
      : 'A directory of Philippine Government Departments. Browse all government departments, their services, and contact information.',
    keywords: [
      ...baseKeywords,
      'Government Departments',
      'Philippine Departments',
      'Government Services',
      'Department Directory',
      ...(departmentName ? [departmentName] : []),
    ],
    canonical: departmentName
      ? `/government/departments/${encodeURIComponent(departmentName)}`
      : '/government/departments',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Government', url: '/government' },
      { name: 'Departments', url: '/government/departments' },
      ...(departmentName
        ? [
            {
              name: departmentName.replace('DEPARTMENT OF ', ''),
              url: `/government/departments/${encodeURIComponent(
                departmentName
              )}`,
            },
          ]
        : []),
    ],
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'GovernmentOrganization',
      name: departmentName || 'Philippine Government Departments',
      url: `https://gov.ph/government/departments${
        departmentName ? `/${encodeURIComponent(departmentName)}` : ''
      }`,
      description: departmentName
        ? `${departmentName} - Philippine Government Department`
        : 'A directory of Philippine Government Departments',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'PH',
        addressLocality: 'Manila',
      },
    },
  };
}

export function getConstitutionalSEOData(
  officeName?: string
): GovernmentSEOData {
  const baseTitle = 'Constitutional Bodies';
  const title = officeName ? `${officeName} - ${baseTitle}` : baseTitle;

  return {
    title,
    description: officeName
      ? `Information and contact details for ${officeName}. A directory of Philippine Constitutional Bodies.`
      : 'A directory of Philippine Constitutional Bodies including independent offices created by the Constitution.',
    keywords: [
      ...baseKeywords,
      'Constitutional Bodies',
      'Constitutional Offices',
      'Independent Bodies',
      'Constitutional Commissions',
      ...(officeName ? [officeName] : []),
    ],
    canonical: officeName
      ? `/government/constitutional/${encodeURIComponent(officeName)}`
      : '/government/constitutional',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Government', url: '/government' },
      { name: 'Constitutional Bodies', url: '/government/constitutional' },
      ...(officeName
        ? [
            {
              name: officeName,
              url: `/government/constitutional/${encodeURIComponent(
                officeName
              )}`,
            },
          ]
        : []),
    ],
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'GovernmentOrganization',
      name: officeName || 'Philippine Constitutional Bodies',
      url: `https://gov.ph/government/constitutional${
        officeName ? `/${encodeURIComponent(officeName)}` : ''
      }`,
      description: officeName
        ? `${officeName} - Philippine Constitutional Body`
        : 'A directory of Philippine Constitutional Bodies',
    },
  };
}

export function getLegislativeSEOData(chamberName?: string): GovernmentSEOData {
  const baseTitle = 'Legislative Branch';
  const title = chamberName ? `${chamberName} - ${baseTitle}` : baseTitle;

  return {
    title,
    description: chamberName
      ? `Information about ${chamberName}. A directory of the Philippine Legislative Branch.`
      : 'A directory of the Philippine Legislative Branch including the Senate and House of Representatives.',
    keywords: [
      ...baseKeywords,
      'Legislative Branch',
      'Philippine Congress',
      'Senate',
      'House of Representatives',
      'Legislators',
      ...(chamberName ? [chamberName] : []),
    ],
    canonical: chamberName
      ? `/government/legislative/${encodeURIComponent(chamberName)}`
      : '/government/legislative',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Government', url: '/government' },
      { name: 'Legislative Branch', url: '/government/legislative' },
      ...(chamberName
        ? [
            {
              name: chamberName,
              url: `/government/legislative/${encodeURIComponent(chamberName)}`,
            },
          ]
        : []),
    ],
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'GovernmentOrganization',
      name: chamberName || 'Philippine Legislative Branch',
      url: `https://gov.ph/government/legislative${
        chamberName ? `/${encodeURIComponent(chamberName)}` : ''
      }`,
      description: chamberName
        ? `${chamberName} - Philippine Legislative Branch`
        : 'A directory of the Philippine Legislative Branch',
    },
  };
}

export function getDiplomaticSEOData(category?: string): GovernmentSEOData {
  const baseTitle = 'Diplomatic Missions';
  const title = category ? `${category} - ${baseTitle}` : baseTitle;

  return {
    title,
    description: category
      ? `Directory of Philippine ${category.toLowerCase()}. A listing of Philippine diplomatic missions worldwide.`
      : 'A directory of Philippine diplomatic missions including embassies, consulates, and international organizations.',
    keywords: [
      ...baseKeywords,
      'Diplomatic Missions',
      'Philippine Embassies',
      'Consulates',
      'International Relations',
      'Foreign Affairs',
      ...(category ? [category] : []),
    ],
    canonical: category
      ? `/government/diplomatic/${category.toLowerCase()}`
      : '/government/diplomatic',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Government', url: '/government' },
      { name: 'Diplomatic Missions', url: '/government/diplomatic' },
      ...(category
        ? [
            {
              name: category,
              url: `/government/diplomatic/${category.toLowerCase()}`,
            },
          ]
        : []),
    ],
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'GovernmentOrganization',
      name: category
        ? `Philippine ${category}`
        : 'Philippine Diplomatic Missions',
      url: `https://gov.ph/government/diplomatic${
        category ? `/${category.toLowerCase()}` : ''
      }`,
      description: category
        ? `Philippine ${category} - Diplomatic Missions`
        : 'A directory of Philippine Diplomatic Missions',
    },
  };
}

export function getLocalGovSEOData(regionName?: string): GovernmentSEOData {
  const baseTitle = 'Local Government Units';
  const title = regionName ? `${regionName} - ${baseTitle}` : baseTitle;

  return {
    title,
    description: regionName
      ? `Directory of local government units in ${regionName}. Cities, municipalities, and provinces in the region.`
      : 'A directory of Philippine Local Government Units organized by region. Find cities, municipalities, and provinces.',
    keywords: [
      ...baseKeywords,
      'Local Government Units',
      'LGU',
      'Cities',
      'Municipalities',
      'Provinces',
      'Regional Government',
      ...(regionName ? [regionName] : []),
    ],
    canonical: regionName
      ? `/government/local/${encodeURIComponent(
          regionName.toLowerCase().replace(/\s+/g, '-')
        )}`
      : '/government/local',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Government', url: '/government' },
      { name: 'Local Government', url: '/government/local' },
      ...(regionName
        ? [
            {
              name: regionName,
              url: `/government/local/${encodeURIComponent(
                regionName.toLowerCase().replace(/\s+/g, '-')
              )}`,
            },
          ]
        : []),
    ],
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'AdministrativeArea',
      name: regionName || 'Philippine Local Government Units',
      url: `https://gov.ph/government/local${
        regionName
          ? `/${encodeURIComponent(
              regionName.toLowerCase().replace(/\s+/g, '-')
            )}`
          : ''
      }`,
      description: regionName
        ? `Local Government Units in ${regionName}`
        : 'A directory of Philippine Local Government Units',
      containedInPlace: {
        '@type': 'Country',
        name: 'Philippines',
      },
    },
  };
}
