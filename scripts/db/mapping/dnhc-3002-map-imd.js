#!/usr/bin/env node
/**
 * Merge IMD rank/decile and IMD score from two workbooks into JSON.
 *
 *   node map-imd-xlsx.js [imdFile] [scoreFile] [outputFile]
 *
 *   - imdFile     : default "imd.xlsx"   (sheet "IMD2019")
 *   - scoreFile   : default "score.xlsx" (sheet "IoD2019 Scores")
 *   - outputFile  : default "imd.json"
 */

const fs           = require('fs');
const path         = require('path');
const readXlsxFile = require('read-excel-file/node');
const ProgressBar  = require('progress');

// ────────────────────────────────
// CLI defaults
// ────────────────────────────────
const imdFile    = path.resolve(process.argv[2] || 'imd.xlsx');
const scoreFile  = path.resolve(process.argv[3] || 'score.xlsx');
const outputFile = path.resolve(process.argv[4] || 'lsoa-imd-mapping.json');

console.log(`IMD file   : ${imdFile}`);
console.log(`Score file : ${scoreFile}`);
console.log(`Output     : ${outputFile}`);

// ────────────────────────────────
// Schemas for the two sheets
// ────────────────────────────────
const schemaIMD = {
  'LSOA code (2011)': {
    prop: 'lsoaCode',
    type: String
  },
  'Index of Multiple Deprivation (IMD) Rank': {
    prop: 'imdRank',
    type: Number
  },
  'Index of Multiple Deprivation (IMD) Decile': {
    prop: 'imdDecile',
    type: Number
  }
};

const schemaScore = {
  'LSOA code (2011)': {
    prop: 'lsoaCode',
    type: String
  },
  'Index of Multiple Deprivation (IMD) Score': {
    prop: 'imdScore',
    type: Number
  }
};

// ────────────────────────────────
// Helper to read a workbook with a progress bar
// ────────────────────────────────
async function readSheetWithProgress(filePath, sheet, schema) {
  let bar;
  try {
    const { size } = fs.statSync(filePath);
    bar = new ProgressBar(`Reading ${path.basename(filePath)} [:bar] :percent :etas`, {
      total: size,
      width: 40
    });
  } catch { /* size unavailable → skip bar */ }

  if (bar) {
    const stream = fs.createReadStream(filePath);
    stream.on('data', chunk => bar.tick(chunk.length));
    return (await readXlsxFile(stream, { sheet, schema })).rows;
  }
  return (await readXlsxFile(filePath, { sheet, schema })).rows;
}

// ────────────────────────────────
// Main
// ────────────────────────────────
(async () => {
  try {
    // 1.  Load rank/decile
    const imdRows = await readSheetWithProgress(imdFile, 'IMD2019', schemaIMD);

    // 2.  Put them into a Map keyed by LSOA
    const map = new Map();
    imdRows.forEach(({ lsoaCode, imdRank, imdDecile }) => {
      if (!lsoaCode) return;                // skip blanks
      map.set(lsoaCode, { lsoaCode, imdRank, imdDecile });
    });

    // 3.  Load scores
    const scoreRows = await readSheetWithProgress(scoreFile, 'IoD2019 Scores', schemaScore);

    // 4.  Merge
    scoreRows.forEach(({ lsoaCode, imdScore }) => {
      if (!lsoaCode) return;
      const rec = map.get(lsoaCode) || { lsoaCode };
      rec.imdScore = imdScore;
      map.set(lsoaCode, rec);
    });

    // 5.  Build inserts array
    const inserts = Array.from(map.values()).sort((a, b) => a.lsoaCode.localeCompare(b.lsoaCode));

    // 6.  Write JSON
    await fs.promises.writeFile(outputFile, JSON.stringify({ inserts }, null, 2));
    console.log('\nJSON file written successfully.');
  } catch (err) {
    console.error('Error:', err.message);
    process.exitCode = 1;
  }
})();
