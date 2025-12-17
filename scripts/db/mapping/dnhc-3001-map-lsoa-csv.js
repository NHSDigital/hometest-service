// This script converts Census postcode lookup CSV to simplified JSON mappings for the nhc-postcode-lsoa-db table.
// Census mappings used can be found here: https://open-geography-portalx-ons.hub.arcgis.com/datasets/c5afedb9204a47e99559a4880feddcb1/about
// Usage:
//   node map-csv.js [inputFilePath] [outputFilePath] [lsoaColumnOverride]
//   - inputFilePath: Path to the input CSV file (default: 'input.csv')
//   - outputFilePath: Path to the output JSON file (default: 'output.json')
//   - lsoaColumnOverride: Name of the column to use for lsoaCode (default: 'lsoa11', might need changing for newer census data)

const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');
const ProgressBar = require('progress');
const { Transform } = require('stream');

// Get command line arguments (or use defaults)
const inputFilePath = process.argv[2] || 'input.csv';
const outputFilePath = process.argv[3] || 'output.json';
const lsoaColumn = process.argv[4] || 'lsoa11';

console.log(`Processing file: ${inputFilePath}`);
console.log(`Output file: ${outputFilePath}`);
console.log(`Using LSOA column: ${lsoaColumn}`);

// This will hold our mapped records.
const results = [];

// Get the input file stats to initialize the progress bar.
fs.stat(path.resolve(inputFilePath), (err, stats) => {
  if (err) {
    console.error('Error getting file stats:', err);
    return;
  }
  const totalSize = stats.size;
  
  // Initialize the progress bar with total size in bytes.
  const bar = new ProgressBar('Processing [:bar] :percent :etas', {
    total: totalSize,
    width: 40
  });
  
  // Create a transform stream to update the progress bar.
  const progressTracker = new Transform({
    transform(chunk, encoding, callback) {
      bar.tick(chunk.length);
      callback(null, chunk);
    }
  });

  // Create the input read stream.
  const readStream = fs.createReadStream(path.resolve(inputFilePath));

  // Process the CSV file.
  readStream
    .pipe(progressTracker)
    .pipe(csvParser())
    .on('data', (row) => {
      // Map the "pcd" field by stripping all whitespace.
      const postcode = row['pcd'] ? row['pcd'].replace(/\s+/g, '') : '';
      // Get the lsoa value using the designated column (default "lsoa11").
      const lsoaValue = row[lsoaColumn] || '';

      // Push the new record into the results array.
      results.push({ postcode, lsoaCode: lsoaValue });
    })
    .on('end', () => {
      // Build the JSON structure with an "inserts" property.
      const outputData = { inserts: results };
      
      // Write the JSON data to the output file with nice formatting.
      fs.writeFile(path.resolve(outputFilePath), JSON.stringify(outputData, null, 2), (err) => {
        if (err) {
          console.error('Error writing output file:', err);
        } else {
          console.log('\nJSON processing complete.');
        }
      });
    })
    .on('error', (err) => {
      console.error('Error while processing CSV:', err);
    });
});