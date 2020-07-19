const moment = require('moment');
const { Parser } = require('json2csv');
const { getDataForDate } = require('../api/api');
const { enrichData } = require('../api/enrich');
const { writeFileSync } = require('fs');
const { getFileSize } = require('./utils'); 
const { resolve } = require('path');

function parseToCsv(data, options) {
  try {
    const parser = new Parser({ flatten: true, header: options.header });
    return parser.parse(data);
  } catch (err) {
    console.error('😤 Error Parsing CSV', err);
    throw err;
  }
}

async function runCSVReport(config, options) {
  const startDate = moment(options.start).unix();
  const endDate = options.end ? moment(options.end).unix() : undefined;

  let data;
  try {
    data = await getDataForDate(config, startDate, endDate);
  } catch (e) {
    console.error('😤 Error fetching data', e);
    throw e;
  }

  const enrichedData = enrichData(config, data, options);

  // Parse the results into a CSV format
  console.info('🔮 Parsing Results')
  const csv = parseToCsv(enrichedData, options);
  console.info('🔮 Parsed CSV');

  const formattedDate = moment(startDate).format('L').split('/').join('');
  const fileName = `export-${formattedDate}.${options.type.toLowerCase()}`;
  const filePath = resolve(process.cwd(), 'data', fileName);
  writeFileSync(filePath, csv);

  const reportSize = getFileSize(filePath);
  console.info(`💾 Report saved (${reportSize}): ${filePath}`);
}

module.exports = {
  runCSVReport
};
