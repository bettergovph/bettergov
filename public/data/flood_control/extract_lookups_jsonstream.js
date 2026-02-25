/**
 * Script to extract lookup data from flood_control.json using JSONStream
 * This script efficiently processes large JSON files and extracts unique values for specified fields
 */

const fs = require('fs');
const path = require('path');
const JSONStream = require('JSONStream');

// Fields to extract lookups for
const fieldsToExtract = [
  'InfraYear',
  'Region',
  'Province',
  'Contractor',
  'DistrictEngineeringOffice',
  'LegislativeDistrict',
  'TypeofWork',
];

// Path to the source JSON file and output directory
const sourcePath = path.join(__dirname, 'flood_control.json');
const outputDir = path.join(__dirname, 'lookups');

// Ensure the output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Initialize maps to store unique values and their counts
const lookups = {};
fieldsToExtract.forEach(field => {
  lookups[field] = new Map();
});

// Process the file using JSONStream
function processFile() {
  console.log('Starting to process flood_control.json...');

  let recordCount = 0;

  // Create a read stream for the JSON file
  const stream = fs.createReadStream(sourcePath, { encoding: 'utf8' });

  // Create a JSON parser that will emit events for each feature in the features array
  const parser = JSONStream.parse('features.*');

  // Process each feature
  parser.on('data', feature => {
    const attributes = feature.attributes;

    // Process each field we want to extract
    fieldsToExtract.forEach(field => {
      if (
        attributes &&
        attributes[field] !== undefined &&
        attributes[field] !== null
      ) {
        const value = attributes[field].toString();

        // Update the count for this value
        if (lookups[field].has(value)) {
          lookups[field].set(value, lookups[field].get(value) + 1);
        } else {
          lookups[field].set(value, 1);
        }
      }
    });

    recordCount++;
    if (recordCount % 1000 === 0) {
      console.log(`Processed ${recordCount} records...`);
    }
  });

  // Handle the end of the stream
  parser.on('end', () => {
    console.log(`Finished processing ${recordCount} records.`);

    // Convert maps to sorted arrays and save to files
    for (const field of fieldsToExtract) {
      // Convert to array of objects with value and count
      const valuesWithCounts = Array.from(lookups[field].entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => a.value.localeCompare(b.value));

      // Also create a simple array of just the values
      const values = valuesWithCounts.map(item => item.value);

      // Save both formats
      const outputPath = path.join(outputDir, `${field}.json`);
      const outputPathWithCounts = path.join(
        outputDir,
        `${field}_with_counts.json`
      );

      fs.writeFileSync(
        outputPath,
        JSON.stringify({ [field]: values }, null, 2)
      );

      fs.writeFileSync(
        outputPathWithCounts,
        JSON.stringify({ [field]: valuesWithCounts }, null, 2)
      );

      console.log(`Saved ${values.length} unique values for ${field}`);
    }
  });

  // Handle errors
  parser.on('error', err => {
    console.error('Error parsing JSON:', err);
  });

  // Pipe the file stream to the parser
  stream.pipe(parser);
}

// Run the processing function
processFile();
