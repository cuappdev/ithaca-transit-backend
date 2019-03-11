// @flow
import AllStopUtils from './AllStopUtils';
import GraphhopperUtils from './GraphhopperUtils';
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
  const departureDelayBuffer = !isArriveBy;

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
 * Queries Graphhopper and returns exactly one walking route and any bus routes.
 *
 * The routes are processed prior to being returned. Note that GraphHopper always returns a walking route.
 *
 * @param destinationName
 * @param end
 * @param start
 * @param departureTimeQuery
 * @param isArriveBy
 * @returns {Promise<Object>}
 */
async function getParsedWalkingAndBusRoutes(
  destinationName: string,
  end: string,
  start: string,
  departureTimeQuery: number,
  isArriveBy: boolean,
): Promise<{ parsedBusRoutes: ?Array<Object>, parsedWalkingRoute: Object }> {
  const { busRoutes, walkingRoute } = await GraphhopperUtils.fetchRoutes(end, start, departureTimeQuery, isArriveBy);
  const parsedWalkingRoute = ParseRouteUtils.parseWalkingRoute(
    walkingRoute,
    GraphhopperUtils.getDepartureTime(departureTimeQuery, isArriveBy, 0),
    destinationName,
  );

  if (!busRoutes) return { parsedWalkingRoute, parsedBusRoutes: null };

  const parsedBusRoutes = await ParseRouteUtils.parseBusRoutes(busRoutes, destinationName);
  return { parsedWalkingRoute, parsedBusRoutes };
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
  const {
    parsedBusRoutes,
    parsedWalkingRoute,
  } = await getParsedWalkingAndBusRoutes(destinationName, end, start, departureTimeQuery, isArriveBy);

  const defaultRoutes = {
    boardingSoon: [],
    fromStop: [],
    walking: [],
  };

  if (!parsedBusRoutes) {
    defaultRoutes.walking.push(parsedWalkingRoute);
    LogUtils.log({ message: 'RouteUtils.js: Graphhopper route error : could not fetch bus routes' });
    return defaultRoutes;
  }

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

/**
 * Filter and validate the array of parsed routes to send to the client.
 *
 * @param routeBus
 * @param routeWalking
 * @param start
 * @param end
 * @param departureTimeQuery
 * @param arriveBy
 * @returns {*}
 */
async function createFinalRoute(
  busRoutes: Array<Object>,
  walkingRoute: Object,
  start: string,
  end: string,
  departureTimeQuery: number,
  isArriveBy: boolean,
) {
  const departureTimeNowMs = parseFloat(departureTimeQuery) * 1000;
  let departureDelayBuffer: boolean = false;
  if (!isArriveBy) { // 'leave at' query
    departureDelayBuffer = true;
  }

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

  if (walkingRoute) { // if a walkingRoute exists append it
    finalRoutes.push(walkingRoute);
  }
  return finalRoutes;
}

async function getRoutes(
  destinationName: string,
  end: string,
  start: string,
  departureTimeQuery: number,
  isArriveBy: boolean,
): Promise<Array<Object>> {
  const {
    parsedBusRoutes,
    parsedWalkingRoute,
  } = await getParsedWalkingAndBusRoutes(destinationName, end, start, departureTimeQuery, isArriveBy);

  if (!parsedBusRoutes) {
    LogUtils.log({ message: 'RouteUtils.js: Graphhopper route error : could not fetch bus routes' });
    return [parsedWalkingRoute];
  }

  // combine and filter to create the final route
  return createFinalRoute(
    parsedBusRoutes,
    parsedWalkingRoute,
    start,
    end,
    departureTimeQuery,
    isArriveBy,
  );
}

export default {
  createFinalRoute,
  createSectionedRoutes,
  flatten,
  getRoutes,
  getSectionedRoutes,
  isBusStop,
};
