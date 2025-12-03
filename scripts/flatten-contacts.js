import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const filePath = join(__dirname, '../src/data/directory/constitutional.json');

// Read the JSON file
const data = JSON.parse(readFileSync(filePath, 'utf8'));

function processObject(obj) {
  // Process nested objects
  Object.keys(obj).forEach(key => {
    if (Array.isArray(obj[key])) {
      // Process array items
      obj[key].forEach(item => processObject(item));
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      // Process nested objects
      processObject(obj[key]);
    }
  });

  // Process contact information
  if (obj.contact && typeof obj.contact === 'object') {
    // Extract email if it exists
    if (obj.contact.email) {
      obj.email = obj.contact.email;
    }

    // Handle phone if it exists
    if (obj.contact.phone) {
      obj.contact = obj.contact.phone;
    } else {
      // Always remove the contact object after extracting email/phone
      delete obj.contact;
    }
  }

  return obj;
}

// Process the entire data array
const processedData = data.map(processObject);

// Write back to the file
writeFileSync(filePath, JSON.stringify(processedData, null, 2));

console.log('Successfully processed and updated the JSON file.');
