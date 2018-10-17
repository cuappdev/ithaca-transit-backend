// @flow
import RequestUtils from './RequestUtils';
import ErrorUtils from './LogUtils';
import ParseRouteUtils from './ParseRouteUtils';

const getGraphhopperBusParams = (end, start, departureTimeQuery, arriveBy) => ({
    elevation: false,
    point: [start, end],
    points_encoded: false,
    vehicle: 'pt',
    weighting: 'short_fastest',
    'pt.arrive_by': arriveBy,
    'ch.disable': true,
    'pt.walk_speed': 3.0, // > 3.0 suggests getting off bus earlier and walk half a mile instead of waiting longer
    'pt.earliest_departure_time': getDepartureTimeDateNow(departureTimeQuery, arriveBy),
    'pt.profile': true,
    'pt.max_walk_distance_per_leg': 2000,
});

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
 * @param end
 * @param start
 * @param departureTimeDateNow
 * @param arriveBy
 * @returns {Promise<{busRoute: any, walkingRoute: any}>}
 */
async function fetchRoutes(end, start, departureTimeDateNow, arriveBy) {
    let busRoute;
    let walkingRoute;

    const options = {
        method: 'GET',
        url: `http://${process.env.GHOPPER_BUS || 'ERROR'}:8988/route`,
        qs: getGraphhopperBusParams(end, start, departureTimeDateNow, arriveBy),
        qsStringifyOptions: { arrayFormat: 'repeat' },
    };
    const walkingOptions = {
        method: 'GET',
        url: `http://${process.env.GHOPPER_WALKING || 'ERROR'}:8987/route`,
        qs: getGraphhopperWalkingParams(end, start),
        qsStringifyOptions: { arrayFormat: 'repeat' },
    };

    let busRouteRequest;
    let walkingRouteRequest;
    await Promise.all([
        RequestUtils.createRequest(
            options,
            `Routing failed: ${process.env.GHOPPER_BUS || 'undefined graphhopper bus env'}`,
            false,
            true,
        ),
        RequestUtils.createRequest(
            walkingOptions,
            `Walking failed: ${process.env.GHOPPER_WALKING || 'undefined graphhopper walking env'}`,
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
            `Routing failed: ${process.env.GHOPPER_BUS || 'undefined graphhopper bus env'}`,
        );
    }

    if (walkingRouteRequest && walkingRouteRequest.statusCode < 300) {
        walkingRoute = JSON.parse(walkingRouteRequest.body);
    } else {
        throw ErrorUtils.logErr(
            walkingRouteRequest && walkingRouteRequest.body,
            getGraphhopperWalkingParams(end, start),
            `Walking failed: ${process.env.GHOPPER_WALKING || 'undefined graphhopper walking env'}`,
        );
    }

    return { busRoute, walkingRoute };
}

async function getRoute(destinationName, end, start, departureTimeQuery, arriveBy) {
    // eslint-disable-next-line no-param-reassign
    arriveBy = (arriveBy === '1' || arriveBy === 'true' || arriveBy === true);

    let { busRoute, walkingRoute } = await fetchRoutes(end, start, departureTimeQuery, arriveBy);

    // parse the graphhopper walking route=
    walkingRoute = ParseRouteUtils.parseWalkingRoute(
        walkingRoute,
        getDepartureTime(departureTimeQuery, arriveBy),
        destinationName,
    );

    // if there are no bus routes, we should just return walking instead of crashing
    if (!busRoute && walkingRoute) {
        return [walkingRoute];
    }

    // parse the graphhopper bus route
    busRoute = await ParseRouteUtils.parseRoute(busRoute || {}, destinationName);

    // combine and filter to create the final route
    ParseRouteUtils.filterRoute(
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
    getDepartureTime,
    getDepartureTimeDateNow,
    getGraphhopperWalkingParams,
    getGraphhopperBusParams,
    getRoute,
    fetchRoutes,
};
