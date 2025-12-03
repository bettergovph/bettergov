const fs = require('fs');
const path = require('path');

// Utility function to create slug from contractor name
const createSlug = name => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
};

// Read the contractor data
const contractorData = JSON.parse(
  fs.readFileSync(
    path.join(
      __dirname,
      '../src/data/flood_control/lookups/Contractor_with_counts.json'
    ),
    'utf8'
  )
);

// Process contractors to split combined entries and create unique list
const uniqueContractors = new Map();

contractorData.Contractor.forEach(contractor => {
  // Split by '/' to handle combined entries
  const contractorNames = contractor.value.split('/');

  contractorNames.forEach(name => {
    // Clean up the name by trimming whitespace and removing "FORMERLY:" parts
    let cleanName = name.trim();

    // Remove "FORMERLY:" and everything after it in parentheses
    cleanName = cleanName.replace(/\(FORMERLY:.*?\)/g, '').trim();

    // Remove extra whitespace
    cleanName = cleanName.replace(/\s+/g, ' ').trim();

    // Skip empty names
    if (!cleanName) return;

    // If contractor already exists, add to count; otherwise, create new entry
    if (uniqueContractors.has(cleanName)) {
      const existing = uniqueContractors.get(cleanName);
      uniqueContractors.set(cleanName, {
        value: cleanName,
        count: existing.count + contractor.count,
        slug: existing.slug, // Keep the existing slug
      });
    } else {
      uniqueContractors.set(cleanName, {
        value: cleanName,
        count: contractor.count,
        slug: createSlug(cleanName),
      });
    }
  });
});

// Convert map to array and sort by count (descending) then by name
const sortedContractors = Array.from(uniqueContractors.values()).sort(
  (a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count; // Sort by count descending
    }
    return a.value.localeCompare(b.value); // Then by name ascending
  }
);

// Create the final object structure
const result = {
  Contractor: sortedContractors,
};

// Write to file
fs.writeFileSync(
  path.join(
    __dirname,
    '../src/data/flood_control/lookups/Unique_contractor_with_counts.json'
  ),
  JSON.stringify(result, null, 2),
  'utf8'
);

console.log(`Processed ${contractorData.Contractor.length} contractor entries`);
console.log(`Generated ${sortedContractors.length} unique contractors`);
console.log(
  'Output saved to src/data/flood_control/lookups/Unique_contractor_with_counts.json'
);
