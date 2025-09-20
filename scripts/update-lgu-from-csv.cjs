// scripts/update-lgu-from-csv.cjs
// Updates lgu.json file based on CSV data with format: locality_type, name, position, official_name

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// File paths
const lguFilePath = path.resolve(__dirname, '../src/data/directory/lgu.json');
const backupPath = path.resolve(__dirname, `../src/data/directory/lgu-backup-${Date.now()}.json`);

// Function to normalize names for comparison
function normalizeName(name) {
  if (!name) return '';
  return name.toLowerCase()
    .trim()
    .replace(/^city of /i, '')
    .replace(/^municipality of /i, '')
    .replace(/ city$/i, '')
    .replace(/ \(capital\)$/i, '')
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Parse CSV line (handles comma inside quotes)
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

// Find and update LGU in the data structure
function updateLGU(data, localityType, lguName, position, officialName) {
  const normalizedLGUName = normalizeName(lguName);
  const isCity = localityType.toLowerCase() === 'city';
  const fieldName = isCity ? 'city' : 'municipality';
  const arrayName = isCity ? 'cities' : 'municipalities';
  let updated = false;
  let foundLocation = null;
  
  // Search in all regions
  for (const region of data) {
    if (!region || typeof region !== 'object') continue;
    
    // Check direct cities/municipalities
    if (Array.isArray(region[arrayName])) {
      for (const lgu of region[arrayName]) {
        if (lgu && lgu[fieldName]) {
          const normalizedCurrent = normalizeName(lgu[fieldName]);
          if (normalizedCurrent === normalizedLGUName) {
            // Update the official's information
            if (position.toLowerCase().includes('mayor') && !position.toLowerCase().includes('vice')) {
              if (!lgu.mayor) lgu.mayor = {};
              lgu.mayor.name = officialName;
              updated = true;
              foundLocation = `${region.region} > ${lgu[fieldName]}`;
            } else if (position.toLowerCase().includes('vice')) {
              if (!lgu.vice_mayor) lgu.vice_mayor = {};
              lgu.vice_mayor.name = officialName;
              updated = true;
              foundLocation = `${region.region} > ${lgu[fieldName]}`;
            }
            break;
          }
        }
      }
    }
    
    // Check provinces
    if (Array.isArray(region.provinces)) {
      for (const province of region.provinces) {
        if (Array.isArray(province[arrayName])) {
          for (const lgu of province[arrayName]) {
            if (lgu && lgu[fieldName]) {
              const normalizedCurrent = normalizeName(lgu[fieldName]);
              if (normalizedCurrent === normalizedLGUName) {
                // Update the official's information
                if (position.toLowerCase().includes('mayor') && !position.toLowerCase().includes('vice')) {
                  if (!lgu.mayor) lgu.mayor = {};
                  lgu.mayor.name = officialName;
                  updated = true;
                  foundLocation = `${region.region} > ${province.province} > ${lgu[fieldName]}`;
                } else if (position.toLowerCase().includes('vice')) {
                  if (!lgu.vice_mayor) lgu.vice_mayor = {};
                  lgu.vice_mayor.name = officialName;
                  updated = true;
                  foundLocation = `${region.region} > ${province.province} > ${lgu[fieldName]}`;
                }
                break;
              }
            }
          }
        }
      }
    }
    
    if (updated) break;
  }
  
  return { updated, location: foundLocation };
}

// Main function to process CSV and update JSON
async function updateFromCSV(csvPath) {
  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found: ${csvPath}`);
    process.exit(1);
  }
  
  console.log(`Reading CSV from: ${csvPath}\n`);
  
  // Load current LGU data
  const lguData = JSON.parse(fs.readFileSync(lguFilePath, 'utf-8'));
  
  // Create backup
  fs.writeFileSync(backupPath, JSON.stringify(lguData, null, 2));
  console.log(`Backup created: ${backupPath}\n`);
  
  // Process CSV
  const fileStream = fs.createReadStream(csvPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  let lineNumber = 0;
  let updatedCount = 0;
  let notFoundCount = 0;
  const notFound = [];
  const updates = [];
  
  for await (const line of rl) {
    lineNumber++;
    
    // Skip empty lines
    if (!line.trim()) continue;
    
    // Skip header if present
    if (lineNumber === 1 && line.toLowerCase().includes('locality_type')) {
      console.log('Skipping header row\n');
      continue;
    }
    
    // Parse CSV line
    const parts = parseCSVLine(line);
    if (parts.length < 4) {
      console.warn(`Line ${lineNumber}: Invalid format (expected 4 columns, got ${parts.length})`);
      continue;
    }
    
    const [localityType, lguName, position, officialName] = parts;
    
    // Validate data
    if (!localityType || !lguName || !position || !officialName) {
      console.warn(`Line ${lineNumber}: Missing required data`);
      continue;
    }
    
    // Update LGU data
    const result = updateLGU(lguData, localityType, lguName, position, officialName);
    
    if (result.updated) {
      updatedCount++;
      updates.push({
        line: lineNumber,
        type: localityType,
        lgu: lguName,
        position: position,
        official: officialName,
        location: result.location
      });
      console.log(`✓ Updated: ${lguName} - ${position}: ${officialName}`);
      console.log(`  Location: ${result.location}`);
    } else {
      notFoundCount++;
      notFound.push({
        line: lineNumber,
        type: localityType,
        lgu: lguName,
        position: position,
        official: officialName
      });
      console.log(`✗ Not found: ${lguName} (${localityType})`);
    }
  }
  
  // Save updated data
  fs.writeFileSync(lguFilePath, JSON.stringify(lguData, null, 2));
  
  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('UPDATE SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total lines processed: ${lineNumber - 1}`); // -1 for header
  console.log(`Successfully updated: ${updatedCount}`);
  console.log(`Not found: ${notFoundCount}`);
  
  if (updates.length > 0) {
    console.log('\n' + '-'.repeat(80));
    console.log('SUCCESSFUL UPDATES:');
    console.log('-'.repeat(80));
    for (const update of updates) {
      console.log(`Line ${update.line}: ${update.type} ${update.lgu}`);
      console.log(`  ${update.position}: ${update.official}`);
      console.log(`  Location: ${update.location}`);
    }
  }
  
  if (notFound.length > 0) {
    console.log('\n' + '-'.repeat(80));
    console.log('NOT FOUND (need to add to database):');
    console.log('-'.repeat(80));
    for (const item of notFound) {
      console.log(`Line ${item.line}: ${item.type} "${item.lgu}" - ${item.position}: ${item.official}`);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log(`Updated file saved to: ${lguFilePath}`);
  console.log(`Backup saved to: ${backupPath}`);
  console.log('='.repeat(80));
}

// Check command line arguments
if (process.argv.length < 3) {
  console.log('Usage: node update-lgu-from-csv.cjs <csv-file-path>');
  console.log('\nCSV Format:');
  console.log('locality_type, municipality/city name, position, official name');
  console.log('\nExample:');
  console.log('city, Manila, Mayor, Juan Dela Cruz');
  console.log('municipality, Bangued, Vice Mayor, Maria Santos');
  process.exit(1);
}

const csvPath = path.resolve(process.argv[2]);
updateFromCSV(csvPath).catch(console.error);
