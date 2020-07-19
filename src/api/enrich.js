const EmailParser = require('email-address-parser');
const UrlParser = require('url-parse');
const pathToRegexp = require('path-to-regexp');
const moment = require('moment');
const { isFunction } = require('lodash');

/**
 * Some basic data filtering.
 */
function filterData(config, data) {
  if (config.blacklists) {
    let shouldFilter = false;
    
    for (const key in config.blacklists) {
      const list = config.blacklists[key];
      const prop = data[key];

      for (const item of list) {
        if (isFunction(item) && item(data)) {
          shouldFilter = true;
          break;
        } else if (item === prop) {
          shouldFilter = true;
          break;
        }
      }
    }

    if (shouldFilter) {
      return false;
    }
  }

  return true;
};

/**
 * Given a URL parse the path
 */
function parsePaths(routes, url) {
  // Try to match a url to our defined routes
  const route = routes.reduce(function(acc, cur) {
    // Test the expression to see if its a match
    const test = cur.matcher.exec(url);
    if (test) {
      acc.push(cur.page);
    }

    return acc;
  }, []);

  // If we found a route, return the page url
  if (route.length) {
    return route[0];
  }

  // If we didn't find one, return the path
  return url;
}

/**
 * Enrich the data in the model.
 * 
 * Model looks like:
 *  {
 *    "IndvId": 5672749318012928,
 *    "UserId": 5672749318012928,
 *    "SessionId": 6029658397540352,
 *    "PageId": 4507921453350912,
 *    "EventStart": "2019-07-15T00:01:23.729Z",
 *    "EventType": "navigate",
 *    "PageDuration": 89791,
 *    "PageActiveDuration": 3528,
 *    "PageUrl": "https://asdf.portal.asdf.ai/hud",
 *    "PageRefererUrl": "https://asdf.portal.asdf.ai/hud",
 *    "PageIp": "111.222.16.333",
 *    "PageLatLong": "32.7673,-96.7776",
 *    "PageAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:67.0) Gecko/20100101 Firefox/67.0",
 *    "PageDevice": "Desktop",
 *    "PageOperatingSystem": "Windows",
 *    "PageNumInfos": 0,
 *    "PageNumWarnings": 0,
 *    "PageNumErrors": 0,
 *    "PageClusterId": 2098,
 *    "UserAppKey": "gunit",
 *    "UserDisplayName": "George Bobby",
 *    "UserEmail": "asdf@asdf.edu"
 *  }
 * 
 * We want to manipulate this data to:
 * 
 *  - Normalize the URLs accross clients by stripping tenant specific address
 *  - Identify the customer by grepping the email domain
 *  - Mash some of the date data
 * 
 */
function enrichData(config, rawResults) {
  // Routes defined by config.
  const routes = config.routes.map(({ route, page }) => ({
    matcher: pathToRegexp(route),
    route,
    page
  }));

  const results = [];

  if (rawResults) {
    for (const data of rawResults) {
      // Given a email get the domain 
      const emailParser = new EmailParser(data.UserEmail);
      data.UserEmailName = emailParser.getUserName();
      data.UserEmailDomain = emailParser.getDomainName();

      // Given a URL get the path for PageUrl
      const urlParser = new UrlParser(data.PageUrl);
      data.PageUrlOrigin = urlParser.origin;
      data.PageUrlPathname = urlParser.pathname;
      data.PageUrlPath = parsePaths(routes, urlParser.pathname);

      // Given a URL get the path for PageRefererUrl
      const refererUrlParser = new UrlParser(data.PageRefererUrl);
      data.PageRefererUrlOrigin = refererUrlParser.origin;
      data.PageRefererUrlPathname = refererUrlParser.pathname;
      data.PageRefererUrlPath = parsePaths(routes, refererUrlParser.pathname);

      // Aggregate some metadata about our dates
      const date = moment(data.EventStart).utc();
      data.EventDay = date.clone().startOf('day').format('YYYY-MM-DD');
      data.EventDayOfWeek = date.clone().startOf('day').format('dddd');
      data.EventHourOfDay = date.clone().format('h A');
      data.EventMonth = date.clone().format('MMMM');

      // Delete the selector element, it messes up csvs
      delete data.EventTargetSelectorTok;

      // Apply transform if present
      if (config.transforms) {
        Object.keys(config.transforms).forEach(key => {
          data[key] = config.transforms[key](data);
        });
      }

      // Must happen after so all properties are populated
      if (filterData(config, data)) {
        results.push(data);
      } 
    }
  }

  return results;
}

module.exports = {
  enrichData
};
