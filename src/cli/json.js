const { resolve } = require('path');
const { writeFileSync } = require('fs');
const { ensureDirSync } = require('fs-extra');
const { getFileSize } = require('./utils');
const getData = require('./batch');

async function runJSONReport(config, options) {
  // Get our results in a batch format
  const results = await getData(config, options);

  if (results.length === 0) {
    console.info('😓 No data found - skipping proccesses');
    return;
  }

  // Ensure directory
  ensureDirSync(resolve(process.cwd(), 'data'));

  // Bin all our results by date
  for (const result of results) {
    // Write our file
    const formattedDate = result.key.split('/').join('');
    const fileName = `export-${formattedDate}.${options.type.toLowerCase()}`;
    const filePath = resolve(process.cwd(), 'data', fileName);
    writeFileSync(filePath, JSON.stringify(result.data, null, 2));

    // Write the report
    const reportSize = getFileSize(filePath);
    console.info(`💾 Report saved (${reportSize}): ${filePath}`);

    // Aggregate our results
    if (options.aggregate) {
      console.info('🔬 Running aggregations');
      const aggregateFilename = `export-${formattedDate}-aggregations.${options.type.toLowerCase()}`;
      const aggregatePath = resolve(process.cwd(), 'data', aggregateFilename);
      writeFileSync(aggregatePath, JSON.stringify(result.aggregate, null, 2));

      const aggregateSize = getFileSize(aggregatePath);
      console.info(`💾 Aggregations saved (${aggregateSize}: ${aggregatePath}`);
    }
  }
}

module.exports = {
  runJSONReport
};
