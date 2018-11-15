// @flow
import moment from 'moment';
import GhopperUtils from './GraphhopperUtils';
import ErrorUtils from './LogUtils';
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
/* eslint-disable no-param-reassign */
async function createFinalRoute(routeBus, routeWalking, start, end, departureTimeQuery, arriveBy) {
    const departureTimeNowMs = parseFloat(departureTimeQuery) * 1000;
    let departureDelayBuffer: boolean = false;
    if (!arriveBy) { // 'leave at' query
        departureDelayBuffer = true;
    }

    const startPoints = start.split(',');
    const endPoints = end.split(',');

    const finalRoutes = (await Promise.all(
        routeBus.map(currPath => ParseRouteUtils.condenseRoute(
            currPath,
            { lat: startPoints[0], long: startPoints[1] },
            { lat: endPoints[0], long: endPoints[1] },
            routeWalking.directions[0].distance,
            departureDelayBuffer,
            departureTimeNowMs,
        )),
    )).filter((route => route !== null));

    // return just walking if no bus routes after filtering
    if (finalRoutes.length === 0 && routeWalking) {
        return routeWalking ? [routeWalking] : [];
    }

    // if walking is > 5 mins faster than the bus, append the walking route
    const busRouteArr = moment(finalRoutes[0].arrivalTime);
    // console.log(busRouteArr.diff(routeWalking.arrivalTime, 'minutes'));
    // if (best bus arrival time) - (walk arrive time) > 5 minutes
    // EX: 6:48am - 6:25am = 23 minutes > 5 minutes
    if (busRouteArr.diff(routeWalking.arrivalTime, 'minutes') > 5) {
        finalRoutes.push(routeWalking);
    }

    return finalRoutes;
}

async function getRoute(destinationName, end, start, departureTimeQuery, arriveBy) {
    // eslint-disable-next-line no-param-reassign
    arriveBy = (arriveBy === '1' || arriveBy === 'true' || arriveBy === true);

    const routeResponses = await GhopperUtils.fetchRoutes(end, start, departureTimeQuery, arriveBy);

    if (!routeResponses) throw ErrorUtils.logErr('Graphhopper route error', routeResponses, 'Could not fetch routes');

    let { busRoute, walkingRoute } = routeResponses;
    // parse the graphhopper walking route=
    walkingRoute = ParseRouteUtils.parseWalkingRoute(
        walkingRoute,
        GhopperUtils.getDepartureTime(departureTimeQuery, arriveBy),
        destinationName,
    );

    // if there are no bus routes, we should just return walking instead of crashing
    if (!busRoute && walkingRoute) {
        return [walkingRoute];
    }

    // parse the graphhopper bus route
    busRoute = await ParseRouteUtils.parseRoute(busRoute, destinationName);

    // combine and filter to create the final route
    busRoute = await createFinalRoute(
        busRoute,
        walkingRoute,
        start,
        end,
        departureTimeQuery,
        arriveBy,
    );

    return busRoute;
}

/*
    { elevation: false,
      point: [ '42.456688,-76.477035', '42.430142,-76.508216' ],
      points_encoded: false,
      vehicle: 'pt',
      'ch.disable': true,
      weighting: 'short_fastest',
      'pt.arrive_by': false,
      'pt.walk_speed': 3,
      'pt.earliest_departure_time': '2018-11-14T04:04:38.000Z',
      'pt.profile': true,
      'pt.max_walk_distance_per_leg': 2000 }
 */

async function getDetailedRoute(destinationName, end, start, departureTimeQuery, arriveBy) {
    // eslint-disable-next-line no-param-reassign
    arriveBy = (arriveBy === '1' || arriveBy === 'true' || arriveBy === true);

    const routeResponses = await GhopperUtils.fetchRoutes(end, start, departureTimeQuery, arriveBy);

    if (!routeResponses) throw ErrorUtils.logErr('Graphhopper route error', routeResponses, 'Could not fetch routes');

    let { busRoute, walkingRoute } = routeResponses;
    // parse the graphhopper walking route=
    walkingRoute = ParseRouteUtils.parseWalkingRoute(
        walkingRoute,
        GhopperUtils.getDepartureTime(departureTimeQuery, arriveBy),
        destinationName,
    );

    // if there are no bus routes, we should just return walking instead of crashing
    if (!busRoute && walkingRoute) {
        return [walkingRoute];
    }

    // parse the graphhopper bus route
    busRoute = await ParseRouteUtils.parseRoute(busRoute, destinationName);

    // combine and filter to create the final route
    busRoute = await createFinalRoute(
        departureTime: Date,
        arrivalTime: Date,
        startCoords: Coordinates, // see below
        endCoords: Coordinates, // see below
        travelDistance: Double, // distance between start and end coords in miles
        startName: String,
        endName: String,
        boundingBox: Bounds, // see below
        totalDuration: Int, // minutes between departureTime and arrivalTime
        routeSummary: [RouteSummaryElement], // see @myo3's comment below
        detailDirections: [Direction], // see comment below
        busRoute,
        walkingRoute,
        start,
        end,
        departureTimeQuery,
        arriveBy,
    );

    return busRoute;
}

export default {
    getRoute,
    getDetailedRoute,
    createFinalRoute,
};
