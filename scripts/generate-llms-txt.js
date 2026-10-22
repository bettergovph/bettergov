#!/usr/bin/env node

/**
 * Script to generate llms.txt file for AI crawler guidance
 * This follows the static site generation pattern used by the GOV.PH portal
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const guides = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, '../src/data/guides/manifest.json'),
    'utf8'
  )
);

// Import data from the project
const serviceCategoriesPath = path.join(
  __dirname,
  '../src/data/service_categories.json'
);
const departmentsPath = path.join(
  __dirname,
  '../src/data/directory/departments.json'
);
const constitutionalPath = path.join(
  __dirname,
  '../src/data/directory/constitutional.json'
);
const legislativePath = path.join(
  __dirname,
  '../src/data/directory/legislative.json'
);
const diplomaticPath = path.join(
  __dirname,
  '../src/data/directory/diplomatic.json'
);
const executivePath = path.join(
  __dirname,
  '../src/data/directory/executive.json'
);
const judicialPath = path.join(
  __dirname,
  '../src/data/directory/judicial.json'
);

// Static navigation data (extracted from navigation.ts to avoid import issues)
const mainNavigation = [
  {
    label: 'Guides',
    href: '/guides',
    children: guides.map(guide => ({
      label: guide.title,
      href: `/guides/${guide.id}`,
    })),
  },
  {
    label: 'Philippines',
    href: '/philippines',
    children: [
      { label: 'About the Philippines', href: '/philippines/about' },
      { label: 'History', href: '/philippines/history' },
      { label: 'Regions', href: '/philippines/regions' },
      { label: 'Map', href: '/philippines/map' },
      { label: 'Hotlines', href: '/philippines/hotlines' },
      { label: 'Holidays', href: '/philippines/holidays' },
    ],
  },
  {
    label: 'Services',
    href: '/services',
    children: [], // Will be populated from service categories
  },
  {
    label: 'Travel',
    href: '/travel',
    children: [
      { label: 'Visa Information', href: '/travel/visa' },
      { label: 'Visa Types', href: '/travel/visa-types' },
      { label: 'Working in the Philippines', href: '/travel/visa-types/swp-c' },
    ],
  },
  {
    label: 'Government',
    href: '/government',
    children: [
      { label: 'Government at a Glance', href: '/government/overview' },
      { label: 'Executive', href: '/government/executive' },
      { label: 'Departments', href: '/government/departments' },
      { label: 'Constitutional', href: '/government/constitutional' },
      { label: 'Legislative', href: '/government/legislative' },
      { label: 'Judicial', href: '/government/judicial' },
      { label: 'Local Government', href: '/government/local' },
      { label: 'Diplomatic', href: '/government/diplomatic' },
      { label: 'Salary Grades', href: '/government/salary-grade' },
    ],
  },
  {
    label: 'Flood Control Projects',
    href: '/flood-control-projects',
    children: [
      { label: 'Charts', href: '/flood-control-projects' },
      { label: 'Table', href: '/flood-control-projects/table' },
      { label: 'Map', href: '/flood-control-projects/map' },
      { label: 'Contractors', href: '/flood-control-projects/contractors' },
    ],
  },
];

// Function to load data
function loadData() {
  try {
    // Import service categories
    const serviceCategoriesRaw = fs.readFileSync(serviceCategoriesPath, 'utf8');
    const serviceCategories = JSON.parse(serviceCategoriesRaw);

    // Import government directory data
    const departments = JSON.parse(fs.readFileSync(departmentsPath, 'utf8'));
    const constitutional = JSON.parse(
      fs.readFileSync(constitutionalPath, 'utf8')
    );
    const legislative = JSON.parse(fs.readFileSync(legislativePath, 'utf8'));
    const diplomatic = JSON.parse(fs.readFileSync(diplomaticPath, 'utf8'));
    const executive = JSON.parse(fs.readFileSync(executivePath, 'utf8'));
    const judicial = JSON.parse(fs.readFileSync(judicialPath, 'utf8'));

    // Populate services children from categories
    const servicesNav = mainNavigation.find(nav => nav.label === 'Services');
    if (servicesNav) {
      servicesNav.children = serviceCategories.categories.map(category => ({
        label: category.category,
        href: `/services?category=${category.slug}`,
      }));
    }

    return {
      mainNavigation,
      serviceCategories,
      departments,
      constitutional,
      legislative,
      diplomatic,
      executive,
      judicial,
    };
  } catch (error) {
    console.error('Error loading data:', error);
    process.exit(1);
  }
}

// Function to generate government directory information
function generateGovernmentDirectory(governmentData) {
  const sections = [];

  // Executive Branch
  sections.push('#### Executive Branch');
  sections.push(
    '- The President of the Philippines (https://www.gov.ph/government/executive/president)'
  );
  sections.push(
    '- The Vice President of the Philippines (https://www.gov.ph/government/executive/vice-president)'
  );
  sections.push(
    '- Office of the President (https://www.gov.ph/government/executive/office-of-the-president)'
  );
  sections.push(
    '- Office of the Vice President (https://www.gov.ph/government/executive/office-of-the-vice-president)'
  );
  sections.push(
    '- Presidential Communications Office (https://www.gov.ph/government/executive/presidential-communications-office)'
  );
  sections.push(
    '- Other Executive Offices (https://www.gov.ph/government/executive/other-executive-offices)'
  );
  sections.push('');

  // Departments
  sections.push('#### Government Departments');
  if (governmentData.departments && Array.isArray(governmentData.departments)) {
    const majorDepartments = governmentData.departments.slice(0, 10); // Show first 10 departments
    majorDepartments.forEach(dept => {
      if (dept.slug && dept.office_name) {
        const deptName = dept.office_name.replace('DEPARTMENT OF ', '');
        sections.push(
          `- ${deptName} (https://www.gov.ph/government/departments/${encodeURIComponent(dept.slug)})`
        );
      }
    });
    if (governmentData.departments.length > 10) {
      sections.push(
        `- ... and ${governmentData.departments.length - 10} more departments (https://www.gov.ph/government/departments)`
      );
    }
  }
  sections.push('');

  // Constitutional Bodies
  sections.push('#### Constitutional Bodies');
  if (
    governmentData.constitutional &&
    Array.isArray(governmentData.constitutional)
  ) {
    const constitutionalOffices = governmentData.constitutional
      .filter(
        office =>
          office.slug &&
          !office.office_type?.includes('Government-Owned') &&
          !office.office_type?.includes('GOCCs') &&
          !office.office_type?.includes('State Universities') &&
          !office.office_type?.includes('SUCs')
      )
      .slice(0, 8); // Show first 8 constitutional offices

    constitutionalOffices.forEach(office => {
      sections.push(
        `- ${office.name || office.office_name} (https://www.gov.ph/government/constitutional/${encodeURIComponent(office.slug)})`
      );
    });

    sections.push(
      '- Government-Owned and Controlled Corporations (https://www.gov.ph/government/constitutional/goccs)'
    );
    sections.push(
      '- State Universities and Colleges (https://www.gov.ph/government/constitutional/sucs)'
    );
  }
  sections.push('');

  // Legislative Branch
  sections.push('#### Legislative Branch');
  sections.push(
    '- Senate of the Philippines (https://www.gov.ph/government/legislative/senate-of-the-philippines-20th-congress)'
  );
  sections.push(
    '- House of Representatives (https://www.gov.ph/government/legislative/house-of-representatives-20th-congress)'
  );
  sections.push(
    '- House Members Directory (https://www.gov.ph/government/legislative/house-members)'
  );
  sections.push(
    '- Party List Members (https://www.gov.ph/government/legislative/party-list-members)'
  );
  sections.push(
    '- Senate Committees (https://www.gov.ph/government/legislative/senate-committees)'
  );
  sections.push('');

  // Judicial Branch
  if (governmentData.judicial && Array.isArray(governmentData.judicial)) {
    sections.push('#### Judicial Branch');
    governmentData.judicial.forEach(court => {
      sections.push(
        `- ${court.name} (https://www.gov.ph/government/judicial/${court.slug})`
      );
    });
    sections.push('');
  }

  // Diplomatic Missions
  sections.push('#### Diplomatic Missions');
  sections.push(
    '- Philippine Embassies and Missions (https://www.gov.ph/government/diplomatic/missions)'
  );
  sections.push(
    '- Philippine Consulates (https://www.gov.ph/government/diplomatic/consulates)'
  );
  sections.push(
    '- International Organizations (https://www.gov.ph/government/diplomatic/organizations)'
  );
  sections.push('');

  return sections;
}

// Function to generate enhanced sitemap URLs
function generateSitemap(mainNavigation, governmentData) {
  const siteUrl = 'https://www.gov.ph';
  const pages = new Set();

  // Add main pages
  pages.add(`${siteUrl}/`);
  pages.add(`${siteUrl}/about`);
  pages.add(`${siteUrl}/search`);
  pages.add(`${siteUrl}/services`);
  pages.add(`${siteUrl}/sitemap`);

  // Add data pages
  pages.add(`${siteUrl}/data/weather`);
  pages.add(`${siteUrl}/data/forex`);

  // Add flood control projects
  pages.add(`${siteUrl}/flood-control-projects`);
  pages.add(`${siteUrl}/flood-control-projects/table`);
  pages.add(`${siteUrl}/flood-control-projects/map`);
  pages.add(`${siteUrl}/flood-control-projects/contractors`);

  // Add navigation-based pages
  mainNavigation.forEach(section => {
    if (section.href) {
      pages.add(`${siteUrl}${section.href}`);
    }
    if (section.children) {
      section.children.forEach(child => {
        if (child.href) {
          pages.add(`${siteUrl}${child.href}`);
        }
      });
    }
  });

  // Add detailed government pages
  if (governmentData) {
    // Executive branch pages
    pages.add(`${siteUrl}/government/executive/president`);
    pages.add(`${siteUrl}/government/executive/vice-president`);
    pages.add(`${siteUrl}/government/executive/office-of-the-president`);
    pages.add(`${siteUrl}/government/executive/office-of-the-vice-president`);
    pages.add(
      `${siteUrl}/government/executive/presidential-communications-office`
    );
    pages.add(`${siteUrl}/government/executive/other-executive-offices`);

    // Department pages
    if (
      governmentData.departments &&
      Array.isArray(governmentData.departments)
    ) {
      governmentData.departments.forEach(dept => {
        if (dept.slug) {
          pages.add(
            `${siteUrl}/government/departments/${encodeURIComponent(dept.slug)}`
          );
        }
      });
    }

    // Constitutional office pages
    if (
      governmentData.constitutional &&
      Array.isArray(governmentData.constitutional)
    ) {
      const constitutionalOffices = governmentData.constitutional.filter(
        office =>
          office.slug &&
          !office.office_type?.includes('Government-Owned') &&
          !office.office_type?.includes('GOCCs') &&
          !office.office_type?.includes('State Universities') &&
          !office.office_type?.includes('SUCs')
      );

      constitutionalOffices.forEach(office => {
        pages.add(
          `${siteUrl}/government/constitutional/${encodeURIComponent(office.slug)}`
        );
      });

      pages.add(`${siteUrl}/government/constitutional/goccs`);
      pages.add(`${siteUrl}/government/constitutional/sucs`);
    }

    // Legislative pages
    pages.add(`${siteUrl}/government/legislative/house-members`);
    pages.add(`${siteUrl}/government/legislative/party-list-members`);
    pages.add(`${siteUrl}/government/legislative/senate-committees`);

    if (
      governmentData.legislative &&
      Array.isArray(governmentData.legislative)
    ) {
      governmentData.legislative.forEach(chamber => {
        if (chamber.slug) {
          pages.add(
            `${siteUrl}/government/legislative/${encodeURIComponent(chamber.slug)}`
          );
        }
      });
    }

    // Diplomatic pages
    pages.add(`${siteUrl}/government/diplomatic/missions`);
    pages.add(`${siteUrl}/government/diplomatic/consulates`);
    pages.add(`${siteUrl}/government/diplomatic/organizations`);
  }

  return Array.from(pages).sort();
}

// Function to generate services directory
function generateServicesDirectory(serviceCategories) {
  const servicesList = [];

  serviceCategories.categories.forEach(category => {
    servicesList.push(
      `- ${category.category} (https://www.gov.ph/services?category=${category.slug})`
    );
    category.subcategories.forEach(subcat => {
      servicesList.push(
        `  - ${subcat.name} (https://www.gov.ph/services?category=${category.slug}&subcategory=${subcat.slug})`
      );
    });
  });

  return servicesList;
}

// Main function to generate llms.txt content
function generateLlmsContent(
  mainNavigation,
  serviceCategories,
  governmentData
) {
  const siteName = 'GOV.PH';
  const siteUrl = 'https://www.gov.ph';
  const description =
    'The proposed portal of the Republic of the Philippines for government services, information, and resources, developed through a community collaboration partnership';

  const sitemap = generateSitemap(mainNavigation, governmentData);
  const servicesDirectory = generateServicesDirectory(serviceCategories);
  const governmentDirectory = generateGovernmentDirectory(governmentData);

  return `# ${siteName}

## About
${description}

GOV.PH is developed by eGov Philippines together with citizen contributors. It builds on the open-source BetterGov.ph portal created by volunteers, and the partnership is making public information and services easier to find, read, and use.

## Key Features
- Comprehensive government directory (Executive, Legislative, Constitutional, Local Government)
- Real-time data widgets (weather, forex rates)
- Emergency hotlines and public services directory
- Flood control projects visualization and data
- Multi-language support (English, Filipino, and regional languages)
- Search functionality across all government services
- Travel and visa information for the Philippines

## Main Sections

### Government Structure
GOV.PH provides detailed information about all branches of the Philippine government:

${governmentDirectory.join('\n')}

### Services Directory
Our comprehensive services are organized into the following categories:
${servicesDirectory.join('\n')}

### Philippines Information
- About the Philippines: Geography, demographics, culture
- Public holidays and observances
- Emergency hotlines and contact information
- Regional information and local government units

### Data and APIs
- Real-time weather data from PAGASA/OpenWeatherMap
- Foreign exchange rates from Bangko Sentral ng Pilipinas
- Government website crawling and content extraction
- Flood control project data and visualization

## Available APIs
- Weather API: ${siteUrl}/api/weather
- Forex API: ${siteUrl}/api/forex

## Sitemap
${sitemap.join('\n')}

## Technology Stack
- Frontend: React 19, TypeScript, Vite, Tailwind CSS
- Backend: Cloudflare Workers (Serverless functions)
- Database: Cloudflare D1 (SQLite)
- Search: Meilisearch
- Internationalization: i18next
- Maps: Leaflet, OpenStreetMap
- Charts: Recharts

## Data Sources
- Official government websites and APIs
- Bangko Sentral ng Pilipinas (BSP) for forex rates
- PAGASA/OpenWeatherMap for weather data
- ArcGIS services for flood control project data
- Official government directories and organizational charts

## Contact and Contribution
- Source code and issue tracker: https://github.com/govph/govph
- Contribution guidelines available at the repository
- Citizen inquiries: Contact Center ng Bayan — https://contactcenterngbayan.gov.ph (hotline 8888)

## Usage Guidelines for AI Systems
This portal organizes Philippine government information and services. When referencing this content:
1. Cite the original government source whenever one is provided
2. Note that government contact information and services may change
3. Direct users to official government websites for current information and transactions
4. Respect the open-source nature of this project
5. Check the stated source and license before reusing data or images

## Last Updated
${new Date().toISOString().split('T')[0]}

## License
This project is open source. Third-party content retains its original source and license.
Educational and informational use is encouraged subject to those licenses.`;
}

// Main execution
function main() {
  console.log('🤖 Generating llms.txt...');

  try {
    // Load data
    const {
      mainNavigation,
      serviceCategories,
      departments,
      constitutional,
      legislative,
      diplomatic,
      executive,
      judicial,
    } = loadData();

    // Prepare government data object
    const governmentData = {
      departments,
      constitutional,
      legislative,
      diplomatic,
      executive,
      judicial,
    };

    // Generate content
    const content = generateLlmsContent(
      mainNavigation,
      serviceCategories,
      governmentData
    );

    // Define output path (public directory)
    const outputPath = path.join(__dirname, '../public/llms.txt');

    // Write file
    fs.writeFileSync(outputPath, content, 'utf8');

    console.log('✅ Successfully generated llms.txt');
    console.log(`📄 File saved to: ${outputPath}`);
    console.log(`📏 Content length: ${content.length} characters`);
  } catch (error) {
    console.error('❌ Error generating llms.txt:', error);
    process.exit(1);
  }
}

// Run the script
main();
