import AllStopUtils from "./AllStopUtils.js";
import GraphhopperUtils from "./GraphhopperUtils.js";
import LogUtils from "./LogUtils.js";
import ParseRouteUtils from "./ParseRouteUtilsV3.js";

/**
 * Returns the flattened version of arr.
 *
 * @param arr
 * @returns {Array<Object>}
 */
function flatten(arr) {
  return [].concat(...arr);
}

/**
 * Returns whether or not location is a bus stop.
 *
 * @param location
 * @returns {Promise<boolean>}
 */
async function isBusStop(location) {
  const stops = await AllStopUtils.getAllStops();
  return stops.filter((s) => s.name === location).length > 0;
}

/**
 * Returns whether [route] contains a bus transfer
 *
 * @param route
 * @returns {boolean}
 */
function routeContainsTransfer(route) {
  const { directions } = route;
  const routeIds = [];
  directions.forEach((direction) => {
    const { routeId } = direction;
    if (routeId && !routeIds.includes(routeId)) routeIds.push(routeId);
  });
  return routeIds.length > 1;
}

/**
 * Returns whether [routeA] and [routeB] share the the same start and end bus stops.
 * @param routeA
 * @param routeB
 * @returns {boolean}
 */
function routesHaveSameStartEndStops(routeA, routeB) {
  const routeADirections = routeA.directions;
  const routeBDirections = routeB.directions;

  if (routeADirections.length < 2 || routeBDirections.length < 2) {
    return false;
  }

  const routeAStartStop = routeADirections[0].name;
  const routeAEndStop = routeADirections[routeADirections.length - 1].name;
  const routeBStartStop = routeBDirections[0].name;
  const routeBEndStop = routeBDirections[routeBDirections.length - 1].name;
  return routeAStartStop === routeBStartStop && routeAEndStop === routeBEndStop;
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
  parsedBusRoutes,
  parsedWalkingRoute,
  start,
  end,
  departureTimeQuery,
  isArriveBy,
  originBusStopName
) {
  const departureTimeNowMs = parseFloat(departureTimeQuery) * 1000;
  const departureDelayBuffer = !isArriveBy;

  const startPointList = start.split(",");
  const endPointList = end.split(",");

  const startPoint = { lat: startPointList[0], long: startPointList[1] };
  const endPoint = { lat: endPointList[0], long: endPointList[1] };

  const finalRoutes = (
    await Promise.all(
      parsedBusRoutes.map((currPath) =>
        ParseRouteUtils.condenseRoute(
          currPath,
          startPoint,
          endPoint,
          parsedWalkingRoute.directions[0].distance,
          departureDelayBuffer,
          departureTimeNowMs
        )
      )
    )
  )
    .filter((route) => route !== null)
    .sort((routeA, routeB) => {
      // For routes that have the same start and end bus stops, the route with
      // the earlier departure time should be shown first.
      if (routesHaveSameStartEndStops(routeA, routeB)) {
        const routeADepartureTime = new Date(routeA.departureTime);
        const routeBDepartureTime = new Date(routeB.departureTime);
        return routeADepartureTime < routeBDepartureTime ? -1 : 1;
      }
      // Otherwise, just use the current order.
      return 0;
    });

  return finalRoutes;
}

/**
 * Queries Graphhopper and returns exactly one walking route and any bus routes.
 *
 * The routes are processed prior to being returned. Note that GraphHopper always returns a walking route.
 *
 * @param originName
 * @param destinationName
 * @param end
 * @param start
 * @param departureTimeQuery
 * @param isArriveBy
 * @returns {Promise<Object>}
 */
async function getParsedWalkingAndBusRoutes(
  originName,
  destinationName,
  end,
  start,
  departureTimeQuery,
  isArriveBy
) {
  const routes = await GraphhopperUtils.fetchRoutes(
    end,
    start,
    departureTimeQuery,
    isArriveBy
  );

  if (!routes) {
    return {
      parsedWalkingRoute: await getParsedWalkingRoute(
        originName,
        destinationName,
        end,
        start,
        departureTimeQuery,
        isArriveBy
      ),
      parsedBusRoutes: null,
    };
  }

  const departureTimeMs = GraphhopperUtils.getDepartureTime(
    departureTimeQuery,
    isArriveBy,
    0
  );
  const parsedRoutes = await ParseRouteUtils.parseRoutes(
    routes,
    originName,
    destinationName,
    departureTimeMs,
    isArriveBy
  );
  let parsedWalkingRoute = parsedRoutes.find(
    (route) => route.numberOfTransfers === -1
  );

  // Make request to Ghopper walking service if the bus service doesn't provide walking directions
  if (!parsedWalkingRoute) {
    parsedWalkingRoute = await getParsedWalkingRoute(
      originName,
      destinationName,
      end,
      start,
      departureTimeQuery,
      isArriveBy
    );
  }

  return {
    parsedWalkingRoute,
    parsedBusRoutes: parsedRoutes.filter(
      (route) => route.numberOfTransfers !== -1
    ),
  };
}

/**
 * Queries Graphhopper for walking directions and returns exactly one walking route.
 *
 * We only query the Graphhopper walking service if the Graphhopper bus service doesn't provide
 * walking directions.
 *
 * @param originName
 * @param destinationName
 * @param end
 * @param start
 * @param departureTimeQuery
 * @param isArriveBy
 * @returns {Promise<Object>}
 */
async function getParsedWalkingRoute(
  originName,
  destinationName,
  end,
  start,
  departureTimeQuery,
  isArriveBy
) {
  const walkingRoute = await GraphhopperUtils.fetchWalkingRoute(end, start);
  return ParseRouteUtils.parseWalkingRoute(
    walkingRoute,
    GraphhopperUtils.getDepartureTime(departureTimeQuery, isArriveBy, 0),
    originName,
    destinationName,
    isArriveBy
  );
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
  originName,
  destinationName,
  end,
  start,
  departureTimeQuery,
  isArriveBy,
  originBusStopName
) {
  const { parsedBusRoutes, parsedWalkingRoute } =
    await getParsedWalkingAndBusRoutes(
      originName,
      destinationName,
      end,
      start,
      departureTimeQuery,
      isArriveBy
    );
  const sectionedRoutes = {
    boardingSoon: [],
    fromStop: [],
    walking: [parsedWalkingRoute],
  };

  if (!parsedBusRoutes) {
    LogUtils.log({
      message:
        "RouteUtils.js: Graphhopper route error : could not fetch bus routes",
    });
    return sectionedRoutes;
  }

  const finalBusRoutes = await createFinalBusRoutes(
    parsedBusRoutes,
    parsedWalkingRoute,
    start,
    end,
    departureTimeQuery,
    isArriveBy
  );

  finalBusRoutes.forEach((route) => {
    if (
      originBusStopName !== null &&
      route.directions &&
      route.directions.length > 0 &&
      route.directions[0].stops.length > 0 &&
      route.directions[0].stops[0].name === originBusStopName
    ) {
      sectionedRoutes.fromStop.push(route);
    } else {
      sectionedRoutes.boardingSoon.push(route);
    }
  });

  return sectionedRoutes;
}

async function getRoutes(
  originName,
  destinationName,
  end,
  start,
  departureTimeQuery,
  isArriveBy
) {
  const { parsedBusRoutes, parsedWalkingRoute } =
    await getParsedWalkingAndBusRoutes(
      originName,
      destinationName,
      end,
      start,
      departureTimeQuery,
      isArriveBy
    );

  if (!parsedBusRoutes) {
    LogUtils.log({
      message:
        "RouteUtils.js: Graphhopper route error : could not fetch bus routes",
    });
    return [parsedWalkingRoute];
  }

  // combine and filter to create the final route
  const finalRoutes = await createFinalBusRoutes(
    parsedBusRoutes,
    parsedWalkingRoute,
    start,
    end,
    departureTimeQuery,
    isArriveBy
  );
  finalRoutes.push(parsedWalkingRoute);
  return finalRoutes;
}

export default {
  flatten,
  getRoutes,
  getSectionedRoutes,
  isBusStop,
  routeContainsTransfer,
};
