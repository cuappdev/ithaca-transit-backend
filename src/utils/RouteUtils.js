// @flow
import GhopperUtils from './GraphhopperUtils';
import LogUtils from './LogUtils';
import ParseRouteUtils from './ParseRouteUtils';

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
  const routeResponses = await GhopperUtils.fetchRoutes(end, start, departureTimeQuery, isArriveBy);
  const { busRoute, walkingRoute } = routeResponses;

  if (!busRoute && !walkingRoute) {
    LogUtils.log({ message: 'RouteUtils.js: Graphhopper route error : could not fetch routes' });
    return [];
  }

  let parsedWalkingRoute;
  if (walkingRoute) {
    // parse the graphhopper walking route
    parsedWalkingRoute = ParseRouteUtils.parseWalkingRoute(
      walkingRoute,
      GhopperUtils.getDepartureTime(departureTimeQuery, isArriveBy, 0),
      destinationName,
    );

    // Ensure that arrivalTime and departureTime have at least one minute difference
    ParseRouteUtils.adjustRouteTimesIfNeeded(parsedWalkingRoute);
  }

  // if there are no bus routes, we should just return walking instead of crashing
  if (!busRoute && parsedWalkingRoute) {
    return [parsedWalkingRoute];
  }

  // parse the graphhopper bus route
  const parsedBusRoutes = await ParseRouteUtils.parseRoute(busRoute, destinationName);

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
  getRoutes,
};
