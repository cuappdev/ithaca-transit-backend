// @flow
import interval from 'interval-promise';
import RequestUtils from './RequestUtils';
import TokenUtils from './TokenUtils';
import ErrorUtils from './LogUtils';

const HOUR_IN_MS = 1000 * 60 * 60;
const DEG_EXACT_PRECISION = 6; // 6 degrees of precision is about a 111 mm, is exact point
const DEG_EQ_PRECISION = 5; // 5 degrees of precision is about a 1.1 meters, is a stop
const DEG_NEARBY_PRECISION = 4; // 4 degrees of precision is about 11 meters, stop nearby
const DEG_WALK_PRECISION = 3; // 3 degrees of precision is about 111 meters, stop walkable
const DEG_KM_PRECISION = 2; // 3 degrees of precision is about 1 km, stop barely walkable

/**
 * Array of all stops
 * @type {Promise<*>}
 */
let allStops = RequestUtils.fetchRetry(fetchAllStops);

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
let allStopsCompareMaps = RequestUtils.fetchRetry(fetchPrecisionMaps);

async function fetchAllStops() {
    try {
        const authHeader = await TokenUtils.fetchAuthHeader();

        const options = {
            method: 'GET',
            url: 'https://gateway.api.cloud.wso2.com:443/t/mystop/tcat/v1/rest/Stops/GetAllStops',
            headers:
                {
                    'Postman-Token': 'b688b636-87ea-4e04-9f3e-ba34e811e639',
                    'Cache-Control': 'no-cache',
                    Authorization: authHeader,
                },
        };

        const stopsRequest = await RequestUtils.createRequest(options, 'allStops request failed');
        if (stopsRequest) {
            return JSON.parse(stopsRequest).map(stop => ({
                name: stop.Name,
                lat: stop.Latitude,
                long: stop.Longitude,
            }));
        }
    } catch (err) {
        ErrorUtils.logErr(err, null, 'allStops error');
        throw err;
    }

    return null;
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
async function getPrecisionMap(degreesPrecision: ?number = DEG_EQ_PRECISION) {
    if (degreesPrecision < 1 || degreesPrecision > 6) {
        return null;
    }
    const stops = await allStops;
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
async function isStopsWithinPrecision(point: Object, degreesPrecision: ?number = DEG_EQ_PRECISION) {
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
    return isStopsWithinPrecision(point, DEG_EQ_PRECISION);
}

function start() {
    interval(async () => {
        // fetch and set allStops and allStopsCompareMaps
        await allStops; // if initializing, don't try again
        await allStopsCompareMaps; // if initializing, don't try again
        allStops = await RequestUtils.fetchRetry(fetchAllStops);
        allStopsCompareMaps = await RequestUtils.fetchRetry(fetchPrecisionMaps);
    }, HOUR_IN_MS, { stopOnError: false });
}

export default {
    start,
    isStop,
    isStopsWithinPrecision,
    allStops,
    DEG_EXACT_PRECISION,
    DEG_EQ_PRECISION,
    DEG_NEARBY_PRECISION,
    DEG_WALK_PRECISION,
    DEG_KM_PRECISION,
};
