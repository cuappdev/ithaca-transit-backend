// @flow
import Constants from './Constants';
import { PYTHON_APP } from './EnvUtils';
import RequestUtils from './RequestUtils';

/**
 * Used for finding stops at or nearby a point
 * Use getPrecisionMap(precision) to access.
 *
 * Contains maps of latitude strings with DEG_EQ_PRECISION to stops
 * with various precision at that latitude.
 * https://en.wikipedia.org/wiki/Decimal_degrees
 *
 * allStopsCompareMaps[5] will give a map with decimal precision 5 (DEG_EQ_PRECISION)
 *
 * Example:
 *
 5: {
    '42.44753': [
        allStops[45]
    ],
    '42.45668': [
        ...
    ],
    ...
 }
 3: {
    '42.447': [
         allStops[234],
         allStops[12],
         ...
    ],
    '42.456': [
        ...
    ],
    ...
 }
 *
 */
let allStopsCompareMaps = RequestUtils.fetchWithRetry(fetchPrecisionMaps);

const updateFunc = async () => {
  allStopsCompareMaps = await RequestUtils.fetchWithRetry(fetchPrecisionMaps);
  return false;
};

RequestUtils.updateObjectOnInterval(
  updateFunc,
  Constants.HOUR_IN_MS,
  Constants.MIN_IN_MS,
  null,
);

async function fetchAllStops() {
  const options = {
    ...Constants.GET_OPTIONS,
    url: `http://${PYTHON_APP || 'localhost'}:5000/stops`,
  };
  const data = await RequestUtils.createRequest(options, 'AllStops request failed');
  return JSON.parse(data);
}

function fetchPrecisionMaps() {
  const maps = {};
  maps[Constants.DEG_EQ_PRECISION] = getPrecisionMap(Constants.DEG_EQ_PRECISION);
  return maps;
}

/**
 * Get a map of latitude strings to stops to find stops at or near a point.
 * Generates map if does not exist at specified precision.
 * @param degreesPrecision
 * @returns {Promise<void>}
 */
async function getPrecisionMap(degreesPrecision: ?number = Constants.DEG_EQ_PRECISION) {
  if (degreesPrecision < Constants.DEG_MIN_PRECISION
    || degreesPrecision > Constants.DEG_MAX_PRECISION
  ) {
    return null;
  }
  const stops = await fetchAllStops();
  if (allStopsCompareMaps && allStopsCompareMaps[degreesPrecision]) {
    return allStopsCompareMaps[degreesPrecision];
  }
  const stopMap = {};
  stops.forEach((stop) => {
    const lat = parseFloat(stop.lat).toFixed(degreesPrecision);
    if (stopMap[lat]) {
      stopMap[lat].push(stop);
    } else {
      stopMap[lat] = [stop];
    }
  });
  allStopsCompareMaps[degreesPrecision] = stopMap;
  return stopMap;
}

/**
 * Return true if a { lat, long } point matches a stop location within some degree of precision
 * @param point
 * @param degreesPrecision
 * @returns {Promise<boolean>}
 */
async function isStopsWithinPrecision(point: Object, degreesPrecision: ?number = Constants.DEG_EQ_PRECISION) {
  const stops = await getPrecisionMap(degreesPrecision);
  const lat = parseFloat(point.lat).toFixed(degreesPrecision);
  let found = stops[lat]; // found stop(s) at lat
  if (found) {
    const long = parseFloat(point.long).toFixed(degreesPrecision);
    // stops[lat] is an array, iterate through possible matches
    found = found.filter((stop) => {
      const longCmpare = parseFloat(stop.long).toFixed(degreesPrecision);
      return long === longCmpare;
    });
    if (found.length > 0) {
      return found;
    }
  }
  return false;
}

/**
 * Return true if a { lat, long } point matches a stop location within a meter
 * @param point
 * @returns {Promise<boolean>}
 */
function isStop(point: Object) {
  return isStopsWithinPrecision(point, Constants.DEG_EQ_PRECISION);
}

export default {
  fetchAllStops,
  isStop,
  isStopsWithinPrecision,
};
