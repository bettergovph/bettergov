#!/usr/bin/env node

/**
 * Script to generate sitemap.xml file for search engines and crawlers
 * This follows the same static site generation pattern as generate-llms-txt.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import data from the project
const serviceCategoriesPath = path.join(
  __dirname,
  '../src/data/service_categories.json'
);

// Static navigation data (same as in generate-llms-txt.js to maintain consistency)
const mainNavigation = [
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
      { label: 'Executive', href: '/government/executive' },
      { label: 'Departments', href: '/government/departments' },
      { label: 'Constitutional', href: '/government/constitutional' },
      { label: 'Legislative', href: '/government/legislative' },
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

    // Populate services children from categories
    const servicesNav = mainNavigation.find(nav => nav.label === 'Services');
    if (servicesNav) {
      servicesNav.children = serviceCategories.categories.map(category => ({
        label: category.category,
        href: `/services?category=${category.slug}`,
      }));
    }

    return { mainNavigation, serviceCategories };
  } catch (error) {
    console.error('Error loading data:', error);
    process.exit(1);
  }
}

// Function to generate all site URLs
function generateSiteUrls(mainNavigation) {
  const siteUrl = 'https://bettergov.ph';
  const urls = new Set();

  // Add main pages with priorities and change frequencies
  const mainPages = [
    { url: `${siteUrl}/`, priority: '1.0', changefreq: 'daily' },
    { url: `${siteUrl}/about`, priority: '0.8', changefreq: 'monthly' },
    { url: `${siteUrl}/search`, priority: '0.9', changefreq: 'weekly' },
    { url: `${siteUrl}/services`, priority: '0.9', changefreq: 'weekly' },
    { url: `${siteUrl}/sitemap`, priority: '0.5', changefreq: 'monthly' },
  ];

  mainPages.forEach(page => urls.add(page));

  // Add data pages
  const dataPages = [
    { url: `${siteUrl}/data/weather`, priority: '0.7', changefreq: 'hourly' },
    { url: `${siteUrl}/data/forex`, priority: '0.7', changefreq: 'daily' },
  ];

  dataPages.forEach(page => urls.add(page));

  // Add flood control projects
  const floodPages = [
    {
      url: `${siteUrl}/flood-control-projects`,
      priority: '0.8',
      changefreq: 'weekly',
    },
    {
      url: `${siteUrl}/flood-control-projects/table`,
      priority: '0.7',
      changefreq: 'weekly',
    },
    {
      url: `${siteUrl}/flood-control-projects/map`,
      priority: '0.7',
      changefreq: 'weekly',
    },
    {
      url: `${siteUrl}/flood-control-projects/contractors`,
      priority: '0.6',
      changefreq: 'monthly',
    },
  ];

  floodPages.forEach(page => urls.add(page));

  // Add navigation-based pages
  mainNavigation.forEach(section => {
    if (section.href) {
      // Determine priority based on section
      let priority = '0.8';
      let changefreq = 'weekly';

      if (section.label === 'Philippines') {
        priority = '0.9';
        changefreq = 'monthly';
      } else if (section.label === 'Services') {
        priority = '0.9';
        changefreq = 'weekly';
      } else if (section.label === 'Government') {
        priority = '0.8';
        changefreq = 'monthly';
      }

      urls.add({
        url: `${siteUrl}${section.href}`,
        priority,
        changefreq,
      });
    }

    if (section.children) {
      section.children.forEach(child => {
        if (child.href) {
          // Child pages get slightly lower priority
          let priority = '0.7';
          let changefreq = 'monthly';

          if (section.label === 'Services') {
            priority = '0.8';
            changefreq = 'weekly';
          } else if (section.label === 'Philippines') {
            priority = '0.7';
            changefreq = 'monthly';
          }

          urls.add({
            url: `${siteUrl}${child.href}`,
            priority,
            changefreq,
          });
        }
      });
    }
  });

  return Array.from(urls);
}

// Function to generate XML sitemap content
function generateSitemapXml(urls) {
  const currentDate = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  urls.forEach(urlObj => {
    xml += `
  <url>
    <loc>${urlObj.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${urlObj.changefreq}</changefreq>
    <priority>${urlObj.priority}</priority>
  </url>`;
  });

  xml += `
</urlset>`;

  return xml;
}

// Main execution
function main() {
  console.log('🗺️  Generating sitemap.xml...');

  try {
    // Load data
    const { mainNavigation } = loadData();

    // Generate URLs
    const urls = generateSiteUrls(mainNavigation);

    // Generate XML content
    const content = generateSitemapXml(urls);

    // Define output path (public directory)
    const outputPath = path.join(__dirname, '../public/sitemap.xml');

    // Write file
    fs.writeFileSync(outputPath, content, 'utf8');

    console.log('✅ Successfully generated sitemap.xml');
    console.log(`📄 File saved to: ${outputPath}`);
    console.log(`🔗 URLs included: ${urls.length}`);
    console.log(`📏 Content length: ${content.length} characters`);
  } catch (error) {
    console.error('❌ Error generating sitemap.xml:', error);
    process.exit(1);
  }
}

// Run the script
main();
