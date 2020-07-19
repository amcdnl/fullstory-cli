const moment = require('moment');
const { getDataForDate } = require('../api/api');
const { group } = require('d3-array');
const { enrichData } = require('../api/enrich');
const { replacer } = require('./utils');
const { allAggs } = require('../api/aggregations');

module.exports = async function(config, options) {
  const startDate = moment(options.start).unix();
  const endDate = options.end ? moment(options.end).unix() : undefined;
  const data = await getDataForDate(config, startDate, endDate);

  // Group our results by date
  const groups = group(data, d =>
    moment(d.EventStart).startOf('day').format('L'));

  // Enrich our data...
  const results = [];
  for (var [key, value] of groups.entries()) {
    if (value) {
      const enrichedData = enrichData(config, value, options);
      const aggregate = options.aggregate ? allAggs(enrichedData) : {};
      
      // Kinda hack-ish but handles the map serialization
      const convertedObj = JSON.parse(JSON.stringify(aggregate, replacer));

      results.push({
        key,
        data: enrichedData,
        aggregate: convertedObj
      });
    }
  }

  return results;
};
