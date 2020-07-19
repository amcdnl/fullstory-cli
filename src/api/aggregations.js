const { rollup, mean } = require('d3-array');

const fns = {
  /**
   * Group by Day
   * 
   * {
   *  '2019-07-15': 34
   * }
   * 
   */
  allEventsByDay: (data) =>
    rollup(
      data,
      d => d.length,
      d => d.EventDay
    ),

  /**
   * Group by Day, Group by Customer
   * 
   * {
   *  '2019-07-15': {
   *    'Panda': 5,
   *    'Gooose': 23
   *  }
   * }
   * 
   */
  allEventsByDayByCustomer: (data) =>
    rollup(
      data,
      d => d.length,
      d => d.EventDay,
      d => d.Customer
    ),

  /**
   * Group by Time of the Day
   * 
   * {
   *  '7 PM': 25
   * }
   * 
   */
  allEventsByTimeOfDay: (data) =>
    rollup(
      data,
      d => d.length,
      d => d.EventHourOfDay
    ),

  /**
   * Group by Day Of Week
   * 
   * {
   *  'Monday': 25
   * }
   * 
   */
  allEventsByDayOfTheWeek: (data) =>
    rollup(
      data,
      d => d.length,
      d => d.EventDayOfWeek
    ),

  /**
   * Group by User
   * 
   * {
   *  'gunit': 25
   * }
   * 
   */
  allEventsByUser: (data) =>
    rollup(
      data,
      d => d.length, 
      d => (d.UserEmail || d.UserAppKey || d.UserId)
    ),

  /**
   * Group by Event Type, Only 'custom' events
   * 
   * {
   *  'Insight Filter': {
   *    'status=foo': 3
   *  }
   * }
   * 
   */
  customEventsByType: (data) =>
    rollup(
      data.filter(d => d.EventType === 'custom'),
      d => d.length,
      d => d.EventCustomName,
      // TODO: Come back later and fix this to be more dynamic
      d => d.evt_query_str || d.evt_view_str
    ),

  /**
   * Group by Browser
   * 
   * {
   *  'IE': 34
   * }
   * 
   */
  allEventsByBrowser: (data) =>
    rollup(
      data,
      d => d.length,
      d => d.PageBrowser
    ),

  /**
   * Group by OS
   * 
   * {
   *  'Windows': 34
   * }
   * 
   */
  allEventsByOS: (data) =>
    rollup(
      data,
      d => d.length,
      d => d.PageOperatingSystem
    ),

  /**
   * Group by Page
   * 
   * {
   *  '/dashboard': 4,
   *  '/dashboard/details': 4
   * }
   * 
   */
  allEventsByPage: (data) =>
    rollup(
      data,
      d => d.length,
      d => d.PageUrlPath
    ),

  /**
   * Group by Page, Group by Customer
   * 
   * {
   *  '/insights': {
   *    'Panda':4,
   *    'Eagle': 4
   *  }
   * }
   * 
   */
  allEventsByPageByCustomer: (data) =>
    rollup(
      data,
      d => d.length,
      d => d.PageUrlPath,
      d => d.Customer
    ),

  /**
   * Group by Page
   * 
   * {
   *  '/dashboard': 50
   * }
   * 
   */
  errorsByPage: (data) =>
    rollup(
      data.filter(d => d.PageNumErrors > 0),
      d => d.length,
      d => d.PageUrlPath
    ),

  /**
   * Mean time to first meaningful paint by Page
   */
  timesToFirstPaintByPage: (data) =>
    rollup(
      data.filter(d => d.EventType === 'load'),
      v => mean(v, d => d.LoadFirstPaintTime),
      d => d.PageUrlPath
    ),

  /**
   * Create a graph representation of the page paths.
   * 
   * {
   *  links: [
   *    {
   *      source: '/',
   *      target: '/dashboard',
   *      value: 45
   *    }
   *  ]
   * }
   * 
   */
  navigateEventsSankey: (raw) => {
    const data = rollup(
      raw.filter(d => d.EventType === 'navigate'),
      d => d.length,
      d => d.PageRefererUrlPath,
      d => d.PageUrlPath
    );

    const links = [];

    for (const [key, value] of data) {
      for (const [childKey, childValue] of value) {
        if (childKey !== key) {
          links.push({
            source: key,
            target: childKey,
            value: childValue
          });
        }
      }
    }

    return {
      links
    };
  }
};

module.exports = {
  ...fns,
  allAggs: (data) =>
    Object.keys(fns)
      .reduce((acc, key) => {
        acc[key] = fns[key](data);
        return acc;
      }, {})
};
