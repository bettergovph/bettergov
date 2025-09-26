const fs = require('fs');
const path = require('path');
const readline = require('readline');

// File paths
const lguFilePath = path.resolve(__dirname, '../src/data/directory/lgu.json');
const backupPath = path.resolve(__dirname, `../src/data/directory/lgu-backup-${Date.now()}.json`);
const notFoundPath = path.resolve(__dirname, '../src/data/directory/lgu-not-found.json');

function normalizeName(name) {
  if (!name) return '';
  return name.toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .replace(/\bcity\b/gi, '')
    .replace(/\bmunicipality\b/gi, '')
    .replace(/\bprovince\b/gi, '')
    .replace(/^city of\s+/i, '')
    .replace(/^municipality of\s+/i, '')
    .replace(/\s+city$/i, '')
    .replace(/\s+municipality$/i, '')
    // Handle common abbreviations
    .replace(/\bgen\b/gi, 'general')
    .replace(/\bsta\b/gi, 'santa')
    .replace(/\bsto\b/gi, 'santo')
    .replace(/\bmt\b/gi, 'mount')
    .replace(/\bst\b/gi, 'saint')
    // Remove spaces in compound names
    .replace(/mataas\s+na\s+kahoy/gi, 'mataasnakahoy')
    .replace(/mendez\s+nunez/gi, 'mendez')
    .replace(/mendez\s+nuñez/gi, 'mendez')
    .replace(/mendeznunez/gi, 'mendez')
    .replace(/mendeznuñez/gi, 'mendez')
    .trim();
}

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

function updateLGU(data, localityType, lguName, position, officialName) {
  // Special handling for Mendez-Nuñez
  if (lguName && lguName.toUpperCase().includes('MENDEZ')) {
    lguName = 'Mendez';
  }
  
  const normalizedLGUName = normalizeName(lguName);
  const isCity = localityType.toLowerCase() === 'city';
  const fieldName = isCity ? 'city' : 'municipality';
  const arrayName = isCity ? 'cities' : 'municipalities';
  let updated = false;
  let foundLocation = null;
  
  for (const region of data) {
    if (!region || typeof region !== 'object') continue;
    
    if (Array.isArray(region[arrayName])) {
      for (const lgu of region[arrayName]) {
        if (lgu && lgu[fieldName]) {
          const normalizedCurrent = normalizeName(lgu[fieldName]);
          if (normalizedCurrent === normalizedLGUName) {
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
    
    if (Array.isArray(region.provinces)) {
      for (const province of region.provinces) {
        if (Array.isArray(province[arrayName])) {
          for (const lgu of province[arrayName]) {
            if (lgu && lgu[fieldName]) {
              const normalizedCurrent = normalizeName(lgu[fieldName]);
              if (normalizedCurrent === normalizedLGUName) {
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

async function updateFromCSV(csvPath) {
  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found: ${csvPath}`);
    process.exit(1);
  }
  
  console.log(`Reading CSV from: ${csvPath}\n`);
  
  const lguData = JSON.parse(fs.readFileSync(lguFilePath, 'utf-8'));
  
  fs.writeFileSync(backupPath, JSON.stringify(lguData, null, 2));
  console.log(`Backup created: ${backupPath}\n`);
  
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
    
    if (!line.trim()) continue;
    if (lineNumber === 1 && line.toLowerCase().includes('locality_type')) {
      console.log('Skipping header row\n');
      continue;
    }
    
    const parts = parseCSVLine(line);
    if (parts.length < 4) {
      console.warn(`Line ${lineNumber}: Invalid format (expected 4 columns, got ${parts.length})`);
      continue;
    }
    
    const [localityType, lguName, position, officialName] = parts;
    
    if (!localityType || !lguName || !position || !officialName) {
      console.warn(`Line ${lineNumber}: Missing required data`);
      continue;
    }
    
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
  
  fs.writeFileSync(lguFilePath, JSON.stringify(lguData, null, 2));
  
  if (notFound.length > 0) {
    const notFoundData = {
      csvFile: path.basename(csvPath),
      totalNotFound: notFound.length,
      cities: [],
      municipalities: []
    };
    
    const processedLGUs = new Map();
    
    for (const item of notFound) {
      const key = `${item.type}-${item.lgu}`;
      
      if (!processedLGUs.has(key)) {
        processedLGUs.set(key, {
          name: item.lgu,
          type: item.type,
          mayor: null,
          vice_mayor: null
        });
      }
      
      const lgu = processedLGUs.get(key);
      
      if (item.position.toLowerCase().includes('mayor') && !item.position.toLowerCase().includes('vice')) {
        lgu.mayor = {
          name: item.official
        };
      } else if (item.position.toLowerCase().includes('vice')) {
        lgu.vice_mayor = {
          name: item.official
        };
      }
    }
    
    for (const lgu of processedLGUs.values()) {
      if (lgu.type.toLowerCase() === 'city') {
        notFoundData.cities.push({
          city: lgu.name,
          mayor: lgu.mayor,
          vice_mayor: lgu.vice_mayor
        });
      } else {
        notFoundData.municipalities.push({
          municipality: lgu.name,
          mayor: lgu.mayor,
          vice_mayor: lgu.vice_mayor
        });
      }
    }
    
    notFoundData.cities.sort((a, b) => a.city.localeCompare(b.city));
    notFoundData.municipalities.sort((a, b) => a.municipality.localeCompare(b.municipality));
    
    fs.writeFileSync(notFoundPath, JSON.stringify(notFoundData, null, 2));
    console.log(`\nNot found localities saved to: ${notFoundPath}`);
  } else {
    if (fs.existsSync(notFoundPath)) {
      fs.unlinkSync(notFoundPath);
      console.log(`\nAll localities found - removed ${path.basename(notFoundPath)}`);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('UPDATE SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total lines processed: ${lineNumber - 1}`);
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
  if (notFound.length > 0) {
    console.log(`Not found localities saved to: ${notFoundPath}`);
  }
  console.log('='.repeat(80));
}

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
