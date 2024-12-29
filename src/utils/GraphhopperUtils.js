import {
  GHOPPER_BUS,
  GHOPPER_WALKING,
} from './EnvUtils.js';
import LogUtils from './LogUtils.js';
import RequestUtils from './RequestUtils.js';

// buffer to account for routes in past 20 minutes with delays
const FIRST_DELAY_BUFFER_IN_MINUTES = 20;

// additional buffer to account for time needed to walk from current location to bus stop
const SECOND_DELAY_BUFFER_IN_MINUTES = 40;

/**
 * https://graphhopper.com/api/1/docs/routing/#output
 * @param end
 * @param start
 * @param departureTimeQuery
 * @param arriveBy
 */
const getGraphhopperBusParams = (
  end,
  start,
  departureTimeQuery,
  arriveBy,
  delayBufferMinutes,
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
function getDepartureTime(departureTimeQuery, isArriveByQuery, delayBufferMinutes) {
  let departureTimeNowMs = parseFloat(departureTimeQuery) * 1000;
  departureTimeNowMs -= delayBufferMinutes * 60 * 1000;
  // if (!isArriveByQuery) { // 'leave at' query
  //   departureTimeNowMs -= delayBufferMinutes * 60 * 1000; // so we can potentially display delayed routes
  // } else {
  //   departureTimeNowMs -= 10 * 60 * 1000;
  // }
  return departureTimeNowMs;
}

function getDepartureTimeDate(departureTimeQuery, isArriveByQuery, delayBufferMinutes) {
  const departureTimeMs = getDepartureTime(departureTimeQuery, isArriveByQuery, delayBufferMinutes);
  return new Date(departureTimeMs).toISOString();
}

/**
 * Returns the graphhopper bus route request options given the following parameters.
 *
 * @param end
 * @param start
 * @param departureTimeDateNow
 * @param isArriveByQuery
 * @param delayBufferMinutes
 * @param sharedOptions
 * @returns {Object}
 */
function getBusRequestOptions(
  end,
  start,
  departureTimeDateNow,
  isArriveByQuery,
  delayBufferMinutes,
  sharedOptions,
) {
  return {
    qs: getGraphhopperBusParams(end, start, departureTimeDateNow, isArriveByQuery, delayBufferMinutes),
    url: `http://${GHOPPER_BUS || 'ERROR'}:8988/route`,
    ...sharedOptions,
  };
}

/**
 * Returns whether two bus route objects are equal by checking their departureTime, arrivalTime,
 * route length, and routeId.
 * @param busRouteA
 * @param busRouteB
 * @returns {boolean}
 */

function busRoutesAreEqual(busRouteA, busRouteB) {
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
 * Returns the array of valid bus routes from [busRoutesToCheck].
 * A bus route is valid if it is not equal to any bus route in [busRoutes].
 *
 * @param busRoutes
 * @param busRoutesToCheck
 * @returns {Array<Object>}
 */
function getValidBusRoutes(busRoutes, busRoutesToCheck) {
  return busRoutesToCheck.filter((busRouteToCheck) => {
    const isDuplicateRoute = busRoutes.find(busRoute => busRoutesAreEqual(busRouteToCheck, busRoute)) !== undefined;
    return !isDuplicateRoute && busRouteToCheck.constructor.transfers !== -1;
  });
}

/**
 * Return {routes} from graphhopper given the parameters
 * {routes} contains an array of up to length 5, with possible bus and walking routes
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
 * @returns {Array<Object>}
 */
async function fetchRoutes(end, start, departureTimeDateNow,
  isArriveByQuery) {
  let routes;

  const sharedOptions = { method: 'GET', qsStringifyOptions: { arrayFormat: 'repeat' } };
  // Fetch bus routes using the current start time
  const busOptionsNow = getBusRequestOptions(end, start, departureTimeDateNow, isArriveByQuery, 0, sharedOptions);

  // Fetch bus routes using a delay buffer of FIRST_DELAY_BUFFER_IN_MINUTES.
  // This means that we are fetching routes with (startTime - FIRST_DELAY_BUFFER_IN_MINUTES).
  // This allows us to display routes that are delayed.
  const busOptionsBufferedFirst = getBusRequestOptions(
    end,
    start,
    departureTimeDateNow,
    isArriveByQuery,
    FIRST_DELAY_BUFFER_IN_MINUTES,
    sharedOptions,
  );

  // Fetch bus routes using a delay buffer of SECOND_DELAY_BUFFER_IN_MINUTES.
  const busOptionsBufferedSecond = getBusRequestOptions(
    end,
    start,
    departureTimeDateNow,
    isArriveByQuery,
    SECOND_DELAY_BUFFER_IN_MINUTES,
    sharedOptions,
  );

  const [
    busRouteNowRequest,
    busRouteBufferedFirstRequest,
    busRouteBufferedSecondRequest,
  ] = await Promise.all([
    RequestUtils.createRequest(
      busOptionsNow,
      `Routing failed: ${GHOPPER_BUS || 'undefined graphhopper bus env'}`,
      false,
      true,
    ),
    RequestUtils.createRequest(
      busOptionsBufferedFirst,
      `Routing failed: ${GHOPPER_BUS || 'undefined graphhopper bus env'}`,
      false,
      true,
    ),
    RequestUtils.createRequest(
      busOptionsBufferedSecond,
      `Routing failed: ${GHOPPER_BUS || 'undefined graphhopper bus env'}`,
      false,
      true,
    ),
  ]);

  if (busRouteNowRequest && busRouteNowRequest.statusCode < 300) {
    routes = JSON.parse(busRouteNowRequest.body).paths;
  } else {
    LogUtils.log(
      busRouteNowRequest && busRouteNowRequest.body,
      getGraphhopperBusParams(end, start, departureTimeDateNow, isArriveByQuery, 0),
      `Routing failed: ${GHOPPER_BUS || 'undefined graphhopper bus env'}`,
    );
  }

  if (busRouteBufferedFirstRequest && busRouteBufferedFirstRequest.statusCode < 300) {
    const bufferedBusRoutes = JSON.parse(busRouteBufferedFirstRequest.body).paths;
    routes = getValidBusRoutes(routes, bufferedBusRoutes).concat(routes);
  } else {
    LogUtils.log(
      busRouteBufferedFirstRequest && busRouteBufferedFirstRequest.body,
      getGraphhopperBusParams(end, start, departureTimeDateNow, isArriveByQuery, FIRST_DELAY_BUFFER_IN_MINUTES),
      `Routing failed: ${GHOPPER_BUS || 'undefined graphhopper bus env'}`,
    );
  }

  if (busRouteBufferedSecondRequest && busRouteBufferedSecondRequest.statusCode < 300) {
    const bufferedBusRoutes = JSON.parse(busRouteBufferedSecondRequest.body).paths;
    routes = getValidBusRoutes(routes, bufferedBusRoutes).concat(routes);
  } else {
    LogUtils.log(
      busRouteBufferedSecondRequest && busRouteBufferedSecondRequest.body,
      getGraphhopperBusParams(end, start, departureTimeDateNow, isArriveByQuery, SECOND_DELAY_BUFFER_IN_MINUTES),
      `Routing failed: ${GHOPPER_BUS || 'undefined graphhopper bus env'}`,
    );
  }

  return routes;
}

/*
* Return walkingRoute from the Graphhopper walking service given the parameters
* walkingRoute contains the shortest possible walking path
* @param end
* @param start
* @returns Object
*/
async function fetchWalkingRoute(end, start) {
  let walkingRoute;

  const walkingOptions = {
    qs: getGraphhopperWalkingParams(end, start),
    url: `http://${GHOPPER_WALKING || 'ERROR'}:8987/route`,
    method: 'GET',
    qsStringifyOptions: { arrayFormat: 'repeat' },
  };

  const walkingRouteRequest = await RequestUtils.createRequest(
    walkingOptions,
    `Walking failed: ${GHOPPER_WALKING || 'undefined graphhopper walking env'}`,
    false,
    true,
  );

  if (walkingRouteRequest && walkingRouteRequest.statusCode < 300) {
    walkingRoute = JSON.parse(walkingRouteRequest.body);
  } else {
    LogUtils.log(
      walkingRouteRequest && walkingRouteRequest.body,
      getGraphhopperWalkingParams(end, start),
      `Walking failed: ${GHOPPER_WALKING || 'undefined graphhopper walking env'}`,
    );
  }

  return walkingRoute;
}

export default {
  fetchRoutes,
  fetchWalkingRoute,
  getDepartureTime,
  getDepartureTimeDate,
  getGraphhopperBusParams,
  getGraphhopperWalkingParams,
};
