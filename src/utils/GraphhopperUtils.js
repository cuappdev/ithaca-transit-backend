import waitOn from 'wait-on';

import {
    GHOPPER_BUS,
    GHOPPER_WALKING,
    MAP_MATCHING,
    NODE_ENV,
} from './EnvUtils';
import ErrorUtils from './LogUtils';
import RequestUtils from './RequestUtils';

const ghopperMapMatchingAddr = `http://${MAP_MATCHING || 'ERROR'}:8989/`;
const ghopperWalkingAddr = `http://${GHOPPER_WALKING || 'ERROR'}:8987/`;
const ghopperBusAddr = `http://${GHOPPER_BUS || 'ERROR'}:8988/`;

const waitOptions = {
    resources: [
        ghopperBusAddr,
        ghopperWalkingAddr,
        ghopperMapMatchingAddr,
    ],
    // timeout: 60000, // timeout in ms, default Infinity
    log: true, // output progress to stdout
};

/**
 * True if ready, awaits graphhopper services in non-production environments
 */
const ghopperReady = (NODE_ENV === 'production')
    || (waitOn(waitOptions).then(() => true).catch((err) => {
        if (err) {
            throw ErrorUtils.logErr(err, waitOptions, 'Failed to connect to graphhopper services');
        }
        return false;
    }));

/**
 * https://graphhopper.com/api/1/docs/routing/#output
 * @param end
 * @param start
 * @param departureTimeQuery
 * @param arriveBy
 */
const getGraphhopperBusParams = (end, start, departureTimeQuery, arriveBy) => ({
    elevation: false,
    point: [start, end],
    points_encoded: false,
    vehicle: 'pt',
    'ch.disable': true,
    weighting: 'short_fastest',
    'pt.arrive_by': arriveBy,
    'pt.walk_speed': 3.0, // > 3.0 suggests getting off bus earlier and walk half a mile instead of waiting longer
    'pt.earliest_departure_time': getDepartureTimeDateNow(departureTimeQuery, arriveBy),
    'pt.profile': true,
    'pt.max_walk_distance_per_leg': 2000,
});

/**
 * https://graphhopper.com/api/1/docs/routing/#output
 * @param end
 * @param start
 * @returns {{point: *[], points_encoded: boolean, vehicle: string}}
 */
const getGraphhopperWalkingParams = (end, start) => ({
    point: [start, end],
    points_encoded: false,
    vehicle: 'foot',
});

function getDepartureTime(departureTimeQuery, arriveBy, delayBuffer = 5) {
    let departureTimeNowMs = parseFloat(departureTimeQuery) * 1000;
    if (!arriveBy) { // 'leave at' query
        departureTimeNowMs -= delayBuffer * 60 * 1000; // so we can potentially display delayed routes
    }
    return departureTimeNowMs;
}

function getDepartureTimeDateNow(departureTimeQuery, arriveBy, delayBuffer = 5) {
    const departureTimeNowMs = getDepartureTime(departureTimeQuery, arriveBy, delayBuffer);
    return new Date(departureTimeNowMs).toISOString();
}

/**
 * Return { busRoute, walkingRoute } from graphhopper given the parameters
 * walkingRoute contains an array with length 1 containing the shortest possible walking path
 * busRoute contains an array of length 5 with possible paths
 * Example return object:
 {
 busRoute:
    { hints:
       { 'visited_nodes.average': '2539', 'visited_nodes.sum': '2539' },
      paths:
       [ { instructions: [Array],
           descend: 0,
           fare: '¤ 1.50',
           ascend: 0,
           distance: 2390.366,
           bbox: [Array],
           weight: 0,
           points_encoded: false,
           points: [Object],
           transfers: 0,
           legs: [Array],
           details: {},
           time: 1425000,
           snapped_waypoints: [Object] },
           ...
           ],
      info:
       { took: 329,
         copyrights: [ 'GraphHopper', 'OpenStreetMap contributors' ] } },

 walkingRoute:
    { hints:
       { 'visited_nodes.average': '3684.0',
         'visited_nodes.sum': '3684' },
      paths:
       [ { instructions: [Array],
           descend: 0,
           ascend: 0,
           distance: 4862.396,
           bbox: [Array],
           weight: 2956.908416,
           points_encoded: false,
           points: [Object],
           transfers: 0,
           legs: [],
           details: {},
           time: 3500866,
           snapped_waypoints: [Object] } ],
      info:
       { took: 6,
         copyrights: [ 'GraphHopper', 'OpenStreetMap contributors' ] } },
 }
 * @param end
 * @param start
 * @param departureTimeDateNow
 * @param arriveBy
 * @returns {Promise<{busRoute: any, walkingRoute: any}>}
 */
async function fetchRoutes(end, start, departureTimeDateNow, arriveBy) {
    const isGhopperReady = await ghopperReady;
    if (!isGhopperReady) return null;
    let busRoute;
    let walkingRoute;

    const options = {
        method: 'GET',
        url: `http://${GHOPPER_BUS || 'ERROR'}:8988/route`,
        qs: getGraphhopperBusParams(end, start, departureTimeDateNow, arriveBy),
        qsStringifyOptions: { arrayFormat: 'repeat' },
    };
    const walkingOptions = {
        method: 'GET',
        url: `http://${GHOPPER_WALKING || 'ERROR'}:8987/route`,
        qs: getGraphhopperWalkingParams(end, start),
        qsStringifyOptions: { arrayFormat: 'repeat' },
    };

    let busRouteRequest;
    let walkingRouteRequest;
    await Promise.all([
        RequestUtils.createRequest(
            options,
            `Routing failed: ${GHOPPER_BUS || 'undefined graphhopper bus env'}`,
            false,
            true,
        ),
        RequestUtils.createRequest(
            walkingOptions,
            `Walking failed: ${GHOPPER_WALKING || 'undefined graphhopper walking env'}`,
            false,
            true,
        ),
    ]).then((vals) => {
        busRouteRequest = vals[0];
        walkingRouteRequest = vals[1];
    });

    if (busRouteRequest && busRouteRequest.statusCode < 300) {
        busRoute = JSON.parse(busRouteRequest.body);
    } else {
        throw ErrorUtils.logErr(
            busRouteRequest && busRouteRequest.body,
            getGraphhopperBusParams(end, start, departureTimeDateNow, arriveBy),
            `Routing failed: ${GHOPPER_BUS || 'undefined graphhopper bus env'}`,
        );
    }

    if (walkingRouteRequest && walkingRouteRequest.statusCode < 300) {
        walkingRoute = JSON.parse(walkingRouteRequest.body);
    } else {
        throw ErrorUtils.logErr(
            walkingRouteRequest && walkingRouteRequest.body,
            getGraphhopperWalkingParams(end, start),
            `Walking failed: ${GHOPPER_WALKING || 'undefined graphhopper walking env'}`,
        );
    }

    await busRoute;
    await walkingRoute;
    return { busRoute, walkingRoute };
}

export default {
    getGraphhopperWalkingParams,
    getGraphhopperBusParams,
    getDepartureTimeDateNow,
    getDepartureTime,
    fetchRoutes,
    ghopperReady,
    ghopperMapMatchingAddr,
    ghopperWalkingAddr,
    ghopperBusAddr,
};
