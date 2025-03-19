import RequestUtils from "./RequestUtils.js";
import geolib from "geolib";

const SEC_IN_MS = 1000;
const MIN_IN_MS = SEC_IN_MS * 60;
const HOUR_IN_MS = MIN_IN_MS * 60;
const DEG_EXACT_PRECISION = 6; // 6 degrees of precision is about a 111 mm, is exact point
const DEG_EQ_PRECISION = 5; // 5 degrees of precision is about a 1.1 meters, is a stop
const DEG_NEARBY_PRECISION = 4; // 4 degrees of precision is about 11 meters, stop nearby
const DEG_WALK_PRECISION = 3; // 3 degrees of precision is about 111 meters, stop walkable
const DEG_KM_PRECISION = 2; // 3 degrees of precision is about 1 km, stop barely walkable

const MIN_DIST_BETWEEN_STOPS = 160.0; // Measured in meters

const STOPS_URL =
  "https://realtimetcatbus.availtec.com/InfoPoint/rest/Stops/GetAllStops";
const BUS_STOP = "busStop";
const COLLEGETOWN_STOP = {
  // Creating "fake" bus stop to remove Google Places central Collegetown location choice
  name: "Collegetown",
  lat: 42.442558,
  long: -76.485336,
  type: BUS_STOP,
};

let stopsData = {};
await fetchAllStops();

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

RequestUtils.updateObjectOnInterval(updateFunc, HOUR_IN_MS, MIN_IN_MS, null);

async function fetchAllStops() {
  try {
    const response = await fetch(STOPS_URL);
    if (!response.ok) {
      throw new Error(`Unable to get stops`);
    }
    const stopList = await response.json();
    const stops = [];
    for (const stop in stopList) {
      stops.push({
        name: stopList[stop].Name,
        lat: stopList[stop].Latitude,
        long: stopList[stop].Longitude,
        type: BUS_STOP,
      });
    }
    stops.push(COLLEGETOWN_STOP);
    stopsData = filterStops(stops);
  } catch (error) {
    console.error(error);
  }
}

function getMiddleCoordinate(coordA, coordB) {
  // Get the coordinate in the middle of coordA and coordB
  const aLat = (Math.PI / 180) * coordA[0];
  const aLong = (Math.PI / 180) * coordA[1];
  const bLat = (Math.PI / 180) * coordB[0];
  const bLong = (Math.PI / 180) * coordB[1];
  const longDiff = bLong - aLong;

  const x = Math.cos(bLat) * Math.cos(longDiff);
  const y = Math.cos(bLat) * Math.sin(longDiff);

  const middleLat = Math.atan2(
    Math.sin(aLat) + Math.sin(bLat),
    Math.sqrt((Math.cos(aLat) + x) ** 2 + y ** 2)
  );
  const middleLong = aLong + Math.atan2(y, Math.cos(aLat) + x);

  return [(180 / Math.PI) * middleLat, (180 / Math.PI) * middleLong];
}

function filterStops(stops) {
  // Create dictionary of stop names to stop information
  const stopNamesToInfo = {};
  stops.forEach((stop) => {
    if (!stopNamesToInfo[stop.name]) {
      stopNamesToInfo[stop.name] = [];
    }
    stopNamesToInfo[stop.name].push(stop);
  });

  // Get all stops with and without duplicate names
  const nonDuplicateStops = [];
  const duplicateStops = [];

  Object.values(stopNamesToInfo).forEach((stopsInfo) => {
    if (stopsInfo.length === 1) {
      nonDuplicateStops.push(stopsInfo[0]);
    } else {
      duplicateStops.push(stopsInfo);
    }
  });

  // Go through the stops with duplicate names
  duplicateStops.forEach((busStops) => {
    const firstStop = busStops[0];
    const lastStop = busStops[busStops.length - 1];
    const firstCoords = { latitude: firstStop.lat, longitude: firstStop.long };
    const lastCoords = { latitude: lastStop.lat, longitude: lastStop.long };

    const distance = geolib.getDistance(firstCoords, lastCoords);

    // If stops are too close to each other, combine into a new stop with averaged location
    if (distance < MIN_DIST_BETWEEN_STOPS) {
      const [middleLat, middleLong] = getMiddleCoordinate(
        [firstStop.lat, firstStop.long],
        [lastStop.lat, lastStop.long]
      );
      const middleStop = {
        name: firstStop.name,
        lat: middleLat,
        long: middleLong,
        type: BUS_STOP,
      };
      nonDuplicateStops.push(middleStop);
    } else {
      // Otherwise, add directly to list of stops
      nonDuplicateStops.push(firstStop);
      nonDuplicateStops.push(lastStop);
    }
  });

  // Lastly, sort by alphabetical order
  const sortedStops = nonDuplicateStops.sort((a, b) =>
    a.name.toUpperCase().localeCompare(b.name.toUpperCase())
  );

  return sortedStops;
}

async function getAllStops() {
  return stopsData;
}

function fetchPrecisionMaps() {
  const maps = {};
  maps[DEG_EQ_PRECISION] = getPrecisionMap(DEG_EQ_PRECISION);
  return maps;
}

/**
 * Get a map of latitude strings to stops to find stops at or near a point.
 * Generates map if does not exist at specified precision.
 * @param degreesPrecision
 * @returns {Promise<void>}
 */
async function getPrecisionMap(degreesPrecision = DEG_EQ_PRECISION) {
  if (degreesPrecision < 1 || degreesPrecision > 6) {
    return null;
  }
  const stops = await getAllStops();
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
async function isStopsWithinPrecision(
  point,
  degreesPrecision = DEG_EQ_PRECISION
) {
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
function isStop(point) {
  return isStopsWithinPrecision(point, DEG_EQ_PRECISION);
}

export default {
  DEG_EQ_PRECISION,
  DEG_EXACT_PRECISION,
  DEG_KM_PRECISION,
  DEG_NEARBY_PRECISION,
  DEG_WALK_PRECISION,
  getAllStops,
  fetchAllStops,
  isStop,
  isStopsWithinPrecision,
};
