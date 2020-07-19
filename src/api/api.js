const axios = require('axios');
const moment = require('moment');

const API_PATH = 'https://export.fullstory.com/api/v1/';

/**
 * Get list of ids for the given date.
 *
 * result.data = [
 *  {
 *    Id:156314880048
 *    Start:1563148800
 *    Stop:1563235200
 *  }
 * ]

 * Reference: https://help.fullstory.com/develop-rest/150106
 */
const getListOfIds = (config, start) =>
  axios.get(API_PATH + 'export/list', {
    params: {
      start
    },
    headers: {
      'Authorization': 'Basic ' + config.apiKey
    }
  }).then(result => result.data);

/**
 * Get the exports for the ids
 * Reference: https://help.fullstory.com/develop-rest/150106
 */
const getExports = (config, id) =>
  axios.get(API_PATH + 'export/get', {
    params: {
      id
    },
    headers: {
      'Authorization': 'Basic ' + config.apiKey
    }
  }).then(result => result.data);

/**
 * Reference: https://help.fullstory.com/develop-rest/150106
 */
async function getDataForDate(config, startDate, endDate) {
  // Get all the ids for the date range
  console.info('📡 Fetching Ids for Dates...',
    moment(startDate).format('MM/DD hh:mm:ss'),
    moment(endDate).format('MM/DD hh:mm:ss')
  );

  // Sigh....
  // https://help.fullstory.com/develop-rest/150106
  const results = []
  let go = true;
  while(go) {
    let data;
    
    try {
      data = await getListOfIds(config, startDate);
      results.push(...data.exports);
    } catch (e) {
      console.error('🤬 Request for ids failed...');
      throw e;
    }

    if (results.length) {
      console.info('📡 Found:', data.exports);
    }

    if (data.exports.length >= 20) {
      startDate = data.exports[data.exports.length - 1].Stop;
      if (endDate && startDate > endDate) {
        go = false;
      } else {
        console.info('🌪 Fetching MOAR starting at:', moment(startDate).format('MM/DD hh:mm:ss'));
      }
    } else {
      go = false;
    }
  }

  // Boo!
  if (results.length === 0) {
    console.info('😓 No results found...');
    return;
  }

  // Fetch all the results from the ids
  console.info('🤖 Fetching Results for Ids...');
  let joins;

  try {
    const exportResults = await Promise.all(results.map(obj => {
      console.info('🤖 Fetching results for...',
        obj.Id,
        moment(obj.Start).format('MM/DD hh:mm:ss'),
        moment(obj.Stop).format('MM/DD hh:mm:ss')
      );
      
      return getExports(config, obj.Id);
    }));

    joins = [].concat(...exportResults);
  } catch (e) {
    console.error('🤬 Request for data failed...');
    throw e;
  }
  
  console.info('🤖 Completed Fetch Results...');

  return joins;
}

module.exports = {
  getListOfIds,
  getExports,
  getDataForDate
};
