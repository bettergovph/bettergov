import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const generateSlug = name => {
  if (!name || typeof name !== 'string') return 'unknown-slug';
  return name
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, '') // Remove special characters
    .replace(/--+/g, '-'); // Replace multiple hyphens with single
};

const getBestName = entry => {
  return (
    entry.name ||
    entry.office ||
    entry.office_name ||
    entry.agency_name ||
    entry.organization_name ||
    entry.chamber ||
    'Unknown Entry'
  );
};

const extractContactInfo = entry => {
  if (entry.contact) return entry.contact;
  if (entry.mayor?.contact) return entry.mayor.contact;
  return null;
};

const extractEmail = entry => {
  if (entry.email) return entry.email;
  if (entry.secretary?.email) return entry.secretary.email;
  if (entry.director?.email) return entry.director.email;
  if (entry.executive_director?.email) return entry.executive_director.email;
  return null;
};

// Process a single entry and add it to the websites array
const processEntry = (
  entry,
  type,
  allWebsiteEntries,
  parentDepartment = null
) => {
  if (!entry) return;

  const name = getBestName(entry);
  const slug = generateSlug(name);
  const contact = extractContactInfo(entry);
  const email = extractEmail(entry);

  // Only add entries with at least a name and either a website, email, or address
  if (name && (entry.website || email || entry.address)) {
    const websiteEntry = {
      name,
      slug,
      email: email,
      website: entry.website || null,
      address: entry.address || null,
      contact: contact,
      type,
      parent_department: parentDepartment || null,
    };

    // Check if this entry already exists (by slug and type)
    const existingIndex = allWebsiteEntries.findIndex(
      item => item.slug === slug && item.type === type
    );

    if (existingIndex === -1) {
      allWebsiteEntries.push(websiteEntry);
    } else {
      // If it exists but the new one has more information, update it
      const existing = allWebsiteEntries[existingIndex];
      allWebsiteEntries[existingIndex] = {
        ...existing,
        email: existing.email || email,
        website: existing.website || entry.website || null,
        address: existing.address || entry.address || null,
        contact: existing.contact || contact,
        parent_department:
          existing.parent_department || parentDepartment || null,
      };
    }
  }
};

// Process nested fields in departments.json
const processNestedFields = (department, type, allWebsiteEntries) => {
  // Get department name for parent reference
  const departmentName = getBestName(department);

  // Process the main department entry
  processEntry(department, type, allWebsiteEntries);

  // Process bureaus and services
  const bureausFields = ['bureaus', 'bureaus_and_services'];
  bureausFields.forEach(field => {
    if (Array.isArray(department[field])) {
      department[field].forEach(bureau => {
        processEntry(bureau, 'bureau', allWebsiteEntries, departmentName);
      });
    }
  });

  // Process agencies under supervision
  const supervisionFields = [
    'under_supervision_and_control',
    'under_administrative_supervision',
    'attached_agencies',
    'attached_corporations',
    'attached_government_corporations',
  ];

  supervisionFields.forEach(field => {
    if (Array.isArray(department[field])) {
      department[field].forEach(agency => {
        processEntry(
          agency,
          field.replace('_', '-'),
          allWebsiteEntries,
          departmentName
        );
      });
    }
  });

  // Process foreign service establishments
  if (Array.isArray(department.foreign_service_establishments)) {
    department.foreign_service_establishments.forEach(embassy => {
      processEntry(
        embassy,
        'foreign-service',
        allWebsiteEntries,
        departmentName
      );
    });
  }

  // Process regional offices
  if (Array.isArray(department.regional_offices)) {
    department.regional_offices.forEach(office => {
      // For regional offices, we need to create a proper name using the region information
      if (office.region) {
        // Create a proper name for the regional office
        const officeName = `${departmentName} - ${office.region} Regional Office`;
        const enhancedOffice = {
          ...office,
          name: officeName,
        };
        processEntry(
          enhancedOffice,
          'regional-office',
          allWebsiteEntries,
          departmentName
        );
      } else {
        processEntry(
          office,
          'regional-office',
          allWebsiteEntries,
          departmentName
        );
      }
    });
  }
};

const main = async () => {
  // Adjusted directoryPath to point to src/data/directory from scripts/
  const directoryPath = path.join(__dirname, '..', 'src', 'data', 'directory');
  // Adjusted outputFilePath to point to src/data/websites.json from scripts/
  const outputFilePath = path.join(
    __dirname,
    '..',
    'src',
    'data',
    'websites.json'
  );
  const allWebsiteEntries = [];

  try {
    const files = await fs.readdir(directoryPath);
    const jsonFiles = files.filter(
      file =>
        path.extname(file).toLowerCase() === '.json' && file !== 'websites.json'
    );

    for (const jsonFile of jsonFiles) {
      const filePath = path.join(directoryPath, jsonFile);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const jsonData = JSON.parse(fileContent);

      const type = path.basename(jsonFile, '.json');

      // Special handling for departments.json with nested structures
      if (jsonFile === 'departments.json' && Array.isArray(jsonData)) {
        jsonData.forEach(department => {
          processNestedFields(department, type, allWebsiteEntries);
        });
        continue;
      }

      // Handle regular JSON files
      if (Array.isArray(jsonData)) {
        jsonData.forEach(entry => {
          processEntry(entry, type, allWebsiteEntries);
        });
      } else if (typeof jsonData === 'object' && jsonData !== null) {
        // Handle LGU structure or other nested objects
        if (jsonFile === 'lgu.json') {
          // For LGU, we need to extract cities from regions
          jsonData.forEach(region => {
            if (Array.isArray(region.cities)) {
              region.cities.forEach(city => {
                processEntry(city, 'lgu', allWebsiteEntries);

                // Also process mayor and vice mayor if they have websites
                if (city.mayor) {
                  const mayorEntry = {
                    ...city.mayor,
                    name: `${city.mayor.name}, Mayor of ${city.city}`,
                    address: city.address,
                  };
                  processEntry(
                    mayorEntry,
                    'local-official',
                    allWebsiteEntries,
                    city.city
                  );
                }

                if (city.vice_mayor) {
                  const viceEntry = {
                    ...city.vice_mayor,
                    name: `${city.vice_mayor.name}, Vice Mayor of ${city.city}`,
                    address: city.address,
                  };
                  processEntry(
                    viceEntry,
                    'local-official',
                    allWebsiteEntries,
                    city.city
                  );
                }
              });
            }
          });
        } else {
          // For other object structures, try to extract entries
          Object.values(jsonData).forEach(value => {
            if (Array.isArray(value)) {
              value.forEach(entry => {
                processEntry(entry, type, allWebsiteEntries);
              });
            }
          });
        }
      }
    }

    // Sort entries by name for better readability
    allWebsiteEntries.sort((a, b) => a.name.localeCompare(b.name));

    await fs.writeFile(
      outputFilePath,
      JSON.stringify(allWebsiteEntries, null, 2)
    );
    console.log(
      `Successfully extracted ${allWebsiteEntries.length} websites to ${outputFilePath}`
    );
  } catch (error) {
    console.error('Error extracting websites:', error);
    console.error(error.stack);
  }
};

main();
