import {
  GHOPPER_BUS,
  GHOPPER_WALKING,
} from './EnvUtils';
import LogUtils from './LogUtils';
import RequestUtils from './RequestUtils';

const DELAY_BUFFER_IN_MINUTES = 20; // buffer for fast walking speeds

/**
 * https://graphhopper.com/api/1/docs/routing/#output
 * @param end
 * @param start
 * @param departureTimeQuery
 * @param arriveBy
 */
const getGraphhopperBusParams = (
  end: string,
  start: string,
  departureTimeQuery: string,
  arriveBy: boolean,
  delayBufferMinutes: number,
) => ({
  'ch.disable': true,
  'pt.arrive_by': arriveBy,
  'pt.earliest_departure_time': getDepartureTimeDate(departureTimeQuery, arriveBy, delayBufferMinutes),
  'pt.max_walk_distance_per_leg': 2000,
  'pt.profile': true,
  'pt.walk_speed': 3.0, // > 3.0 suggests getting off bus earlier and walk half a mile instead of waiting longer
  elevation: false,
  point: [start, end],
  points_encoded: false,
  vehicle: 'pt',
  weighting: 'short_fastest',
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

/*
 * Return departure time in millseconds
 *
 * @param departureTimeQuery
 */
function getDepartureTime(departureTimeQuery: string, isArriveByQuery: boolean, delayBufferMinutes: number) {
  let departureTimeNowMs = parseFloat(departureTimeQuery) * 1000;
  if (!isArriveByQuery) { // 'leave at' query
    departureTimeNowMs -= delayBufferMinutes * 60 * 1000; // so we can potentially display delayed routes
  }
  return departureTimeNowMs;
}

function getDepartureTimeDate(departureTimeQuery: string, isArriveByQuery: boolean, delayBufferMinutes) {
  const departureTimeMs = getDepartureTime(departureTimeQuery, isArriveByQuery, delayBufferMinutes);
  return new Date(departureTimeMs).toISOString();
}

/**
 * Returns whether two bus route objects are equal by checking their departureTime, arrivalTime,
 * route length, and routeId.
 * @param busRouteA
 * @param busRouteB
 * @returns {boolean}
 */

function busRoutesAreEqual(busRouteA: Object, busRouteB: Object): boolean {
  const legsA = busRouteA.legs;
  const legsB = busRouteB.legs;

  // Compare departure and arrival times
  const departureTimeA = legsA[0].departureTime;
  const arrivalTimeA = legsA[legsA.length - 1].arrivalTime;

  const departureTimeB = legsB[0].departureTime;
  const arrivalTimeB = legsB[legsB.length - 1].arrivalTime;

  if (departureTimeA !== departureTimeB || arrivalTimeA !== arrivalTimeB) {
    return false;
  }

  // Compare route ids
  const departLegA = legsA.find(leg => leg.type === 'pt');
  const departLegB = legsB.find(leg => leg.type === 'pt');

  const isEqualLength = legsA.length === legsB.length;

  // departLegA and departLegB should never be undefined because all bus routes should
  // have a leg of type pt. (pt refers to taking a bus)
  if (!departLegA || !departLegB) {
    return isEqualLength;
  }

  return (departLegA.route_id === departLegB.route_id) && isEqualLength;
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
 * @param isArriveByQuery
 * @returns {Promise<{busRoute: any, walkingRoute: any}>}
 */
async function fetchRoutes(end: string, start: string, departureTimeDateNow: string, isArriveByQuery: boolean): Object {
  let busRoutes;
  let walkingRoute;

  const sharedOptions = { method: 'GET', qsStringifyOptions: { arrayFormat: 'repeat' } };
  // Fetch bus routes using the current start time
  const busOptionsNow = {
    qs: getGraphhopperBusParams(end, start, departureTimeDateNow, isArriveByQuery, 0),
    url: `http://${GHOPPER_BUS || 'ERROR'}:8988/route`,
    ...sharedOptions,
  };

  // Fetch bus routes using a delay buffer of DELAY_BUFFER_IN_MINUTES.
  // This means that we are fetching routes with (startTime - DELAY_BUFFER_IN_MINUTES).
  // This allows us to display routes that are delayed.
  const busOptionsBuffered = {
    qs: getGraphhopperBusParams(end, start, departureTimeDateNow, isArriveByQuery, DELAY_BUFFER_IN_MINUTES),
    url: `http://${GHOPPER_BUS || 'ERROR'}:8988/route`,
    ...sharedOptions,
  };

  const walkingOptions = {
    qs: getGraphhopperWalkingParams(end, start),
    url: `http://${GHOPPER_WALKING || 'ERROR'}:8987/route`,
    ...sharedOptions,
  };

  const [busRouteNowRequest, busRouteBufferedRequest, walkingRouteRequest] = await Promise.all([
    RequestUtils.createRequest(
      busOptionsNow,
      `Routing failed: ${GHOPPER_BUS || 'undefined graphhopper bus env'}`,
      false,
      true,
    ),
    RequestUtils.createRequest(
      busOptionsBuffered,
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
  ]);

  if (busRouteNowRequest && busRouteNowRequest.statusCode < 300) {
    busRoutes = JSON.parse(busRouteNowRequest.body).paths;
  } else {
    LogUtils.log(
      busRouteNowRequest && busRouteNowRequest.body,
      getGraphhopperBusParams(end, start, departureTimeDateNow, isArriveByQuery),
      `Routing failed: ${GHOPPER_BUS || 'undefined graphhopper bus env'}`,
    );
  }

  if (busRouteBufferedRequest && busRouteBufferedRequest.statusCode < 300) {
    const bufferedBusRoutes = JSON.parse(busRouteBufferedRequest.body).paths;
    const validBusRoutes = bufferedBusRoutes.filter((bufferedRoute) => {
      const isDuplicateRoute = busRoutes.find(busRoute => busRoutesAreEqual(bufferedRoute, busRoute)) !== undefined;
      return !isDuplicateRoute;
    });
    busRoutes = validBusRoutes.concat(busRoutes);
  } else {
    LogUtils.log(
      busRouteBufferedRequest && busRouteBufferedRequest.body,
      getGraphhopperBusParams(end, start, departureTimeDateNow, isArriveByQuery),
      `Routing failed: ${GHOPPER_BUS || 'undefined graphhopper bus env'}`,
    );
  }

  if (walkingRouteRequest && walkingRouteRequest.statusCode < 300) {
    walkingRoute = JSON.parse(walkingRouteRequest.body);
  } else {
    LogUtils.log(
      walkingRouteRequest && walkingRouteRequest.body,
      getGraphhopperWalkingParams(end, start),
      `Walking failed: ${GHOPPER_WALKING || 'undefined graphhopper walking env'}`,
    );
  }

  return { busRoutes, walkingRoute };
}

export default {
  fetchRoutes,
  getDepartureTime,
  getDepartureTimeDate,
  getGraphhopperBusParams,
  getGraphhopperWalkingParams,
};
