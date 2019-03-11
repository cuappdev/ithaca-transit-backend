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
  const defaultRoutes = {
    boardingSoon: [],
    fromStop: [],
    walking: [],
  };

  const routeResponses = await GraphhopperUtils.fetchRoutes(end, start, departureTimeQuery, isArriveBy);
  const { busRoutes, walkingRoute } = routeResponses;

  if (!busRoutes && !walkingRoute) {
    LogUtils.log({ message: 'RouteUtils.js: Graphhopper route error : could not fetch routes' });
    return defaultRoutes;
  }

  let parsedWalkingRoute;
  if (walkingRoute) {
    // parse the graphhopper walking route
    parsedWalkingRoute = ParseRouteUtils.parseWalkingRoute(
      walkingRoute,
      GraphhopperUtils.getDepartureTime(departureTimeQuery, isArriveBy, 0),
      destinationName,
    );

    // Ensure that arrivalTime and departureTime have at least one minute difference
    ParseRouteUtils.adjustRouteTimesIfNeeded(walkingRoute);
  }

  // if there are no bus routes, we should just return walking instead of crashing
  if (!busRoutes && parsedWalkingRoute) {
    defaultRoutes.walking.push(parsedWalkingRoute);
    return defaultRoutes;
  }

  // parse the graphhopper bus route
  const parsedBusRoutes = await ParseRouteUtils.parseBusRoutes(busRoutes, destinationName);

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

/**
 * Filter and validate the array of parsed routes to send to the client.
 *
 * @param arr
 * @returns {Array<Object>}
 */
function flatten(arr: Array<Array<Object>>): Array<Object> {
  return [].concat(...arr);
}

/**
 * Returns whether or not location is a bus stop.
 *
 * @param location
 * @returns {Promise<boolean>}
 */
async function isBusStop(location: string): Promise<boolean> {
  const stops = await AllStopUtils.fetchAllStops();
  return stops.filter(s => s.name === location).length > 0;
}

/**
 * Filter and validate the array of bus routes to send to the client.
 *
 * @param parsedBusRoutes
 * @param parsedWalkingRoute
 * @param start
 * @param end
 * @param departureTimeQuery
 * @param isArriveBy
 * @param originBusStopName
 * @returns {Promise<Object>}
 */
async function createFinalBusRoutes(
  parsedBusRoutes: Array<Object>,
  parsedWalkingRoute: Object,
  start: string,
  end: string,
  departureTimeQuery: number,
  isArriveBy: boolean,
  originBusStopName: ?string,
): Promise<Array<Object>> {
  const departureTimeNowMs = parseFloat(departureTimeQuery) * 1000;
  const departureDelayBuffer = !isArriveBy;

  const startPointList = start.split(',');
  const endPointList = end.split(',');

  const startPoint = { lat: startPointList[0], long: startPointList[1] };
  const endPoint = { lat: endPointList[0], long: endPointList[1] };

  const finalRoutes = (await Promise.all(
    parsedBusRoutes.map(currPath => ParseRouteUtils.condenseRoute(
      currPath,
      startPoint,
      endPoint,
      parsedWalkingRoute.directions[0].distance,
      departureDelayBuffer,
      departureTimeNowMs,
    )),
  )).filter(route => route !== null);

  return finalRoutes;
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
  const sectionedRoutes = {
    boardingSoon: [],
    fromStop: [],
    walking: [parsedWalkingRoute],
  };

  if (!parsedBusRoutes) {
    LogUtils.log({ message: 'RouteUtils.js: Graphhopper route error : could not fetch bus routes' });
    return sectionedRoutes;
  }

  const finalBusRoutes = await createFinalBusRoutes(
    parsedBusRoutes,
    parsedWalkingRoute,
    start,
    end,
    departureTimeQuery,
    isArriveBy,
  );

  finalBusRoutes.forEach((route) => {
    if (originBusStopName !== null
      && route.directions
      && route.directions.length > 0
      && route.directions[0].stops.length > 0
      && route.directions[0].stops[0].name === originBusStopName
    ) {
      sectionedRoutes.fromStop.push(route);
    } else {
      sectionedRoutes.boardingSoon.push(route);
    }
  });

  return sectionedRoutes;
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
  const finalRoutes = await createFinalBusRoutes(
    parsedBusRoutes,
    parsedWalkingRoute,
    start,
    end,
    departureTimeQuery,
    isArriveBy,
  );
  finalRoutes.push(parsedWalkingRoute);
  return finalRoutes;
}

export default {
  flatten,
  getRoutes,
  getSectionedRoutes,
  isBusStop,
};
