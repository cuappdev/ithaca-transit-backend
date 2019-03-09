// @flow
import AllStopUtils from './AllStopUtils';
import GhopperUtils from './GraphhopperUtils';
import LogUtils from './LogUtils';
import ParseRouteUtils from './ParseRouteUtils';

/**
 * Returns the flattened version of arr.
 * @param arr
 * @returns {Array<Object>}
 */
function flatten(arr: Array<Array<Object>>): Array<Object> {
  return [].concat(...arr);
}

/**
 * Returns whether or not location is a bus stop.
 * @param location
 * @returns {Promise<boolean>}
 */
async function isBusStop(location: string): Promise<boolean> {
  const stops = await AllStopUtils.fetchAllStops();
  return stops.filter(s => s.name === location).length > 0;
}

/**
 * Filter and validate the array of parsed routes to send to the client
 * and then return routes categorized as fromStop, boardingSoon, or walking.
 *
 * @param routeBus
 * @param routeWalking
 * @param start
 * @param end
 * @param departureTimeQuery
 * @param isArriveBy
 * @param originBusStopName
 * @returns {Promise<Object>}
 */
async function createSectionedRoutes(
  busRoutes: Array<Object>,
  walkingRoute: Object,
  start: string,
  end: string,
  departureTimeQuery: number,
  isArriveBy: boolean,
  originBusStopName: ?string,
): Promise<Object> {
  const departureTimeNowMs = parseFloat(departureTimeQuery) * 1000;
  const departureDelayBuffer: boolean = !isArriveBy;

  const startPoint = ParseRouteUtils.latLongFromStr(start);
  const endPoint = ParseRouteUtils.latLongFromStr(end);

  const finalRoutes = (await Promise.all(
    busRoutes.map(currPath => ParseRouteUtils.condenseRoute(
      currPath,
      startPoint,
      endPoint,
      walkingRoute.directions[0].distance,
      departureDelayBuffer,
      departureTimeNowMs,
    )),
  )).filter(route => route !== null);

  const sectionedRoutes = {
    boardingSoon: [],
    fromStop: [],
    walking: [],
  };

  if (walkingRoute) { // if a walkingRoute exists append it
    sectionedRoutes.walking.push(walkingRoute);
  }

  finalRoutes.forEach((r) => {
    if (originBusStopName !== null) {
      const { directions } = r;
      if (directions.length > 0) {
        const { stops } = directions[0];
        if (stops.length > 0 && stops[0].name === originBusStopName) {
          sectionedRoutes.fromStop.push(r);
          return;
        }
      }
    }
    sectionedRoutes.boardingSoon.push(r);
  });

  return sectionedRoutes;
}

/**
 * Returns the routes for a search categorizing them as being fromStop,
 * boardingSoon, or walking.
 *
 * @param destinationName
 * @param end
 * @param start
 * @param departureTimeQuery
 * @param isArriveBy
 * @param originBusStopName
 * @returns {Promise<Object>}
 */
async function getSectionedRoutes(
  destinationName: string,
  end: string,
  start: string,
  departureTimeQuery: number,
  isArriveBy: boolean,
  originBusStopName: ?string,
): Promise<Object> {
  const routeResponses = await GhopperUtils.fetchRoutes(end, start, departureTimeQuery, isArriveBy);

  if (!routeResponses) {
    throw LogUtils.logErr({ message: 'RouteUtils.js: Graphhopper route error : could not fetch routes' });
  }

  const { busRoute, walkingRoute } = routeResponses;
  // parse the graphhopper walking route
  const parsedWalkingRoute = ParseRouteUtils.parseWalkingRoute(
    walkingRoute,
    GhopperUtils.getDepartureTime(departureTimeQuery, isArriveBy, 0),
    destinationName,
  );

  // Ensure that arrivalTime and departureTime have at least one minute difference
  ParseRouteUtils.adjustRouteTimesIfNeeded(walkingRoute);

  // if there are no bus routes, we should just return walking instead of crashing
  if (!busRoute && parsedWalkingRoute) {
    return [parsedWalkingRoute];
  }

  // parse the graphhopper bus route
  const parsedBusRoutes = await ParseRouteUtils.parseRoute(busRoute, destinationName);

  // combine and filter to create the final route
  return createSectionedRoutes(
    parsedBusRoutes,
    parsedWalkingRoute,
    start,
    end,
    departureTimeQuery,
    isArriveBy,
    originBusStopName,
  );
}

export default {
  flatten,
  getSectionedRoutes,
  isBusStop,
};
