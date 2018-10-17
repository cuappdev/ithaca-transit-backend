/* eslint-disable no-underscore-dangle */
import ParseRouteUtils from '../utils/ParseRouteUtils';

const request = require('supertest');
const moment = require('moment');
const jsondiffpatch = require('jsondiffpatch');
// eslint-disable-next-line no-unused-vars
const TestUtils = require('./TestUtils');
const {
    routeTests,
} = require('./TestGlobals').default;
const RouteUtils = require('../utils/RouteUtils.js').default;

describe('Route unit tests', () => {
    routeTests.forEach((routeParams) => {
        describe(routeParams.name, () => {
            const { arriveBy, destinationName } = routeParams.params;
            let { end, start } = routeParams.params;
            const { time } = routeParams;
            end = `${end.lat},${end.long}`;
            start = `${start.lat},${start.long}`;
            let fetchRouteData;

            describe('RouteUtils', () => {
                test('RouteUtils.getGraphhopperBusParams', async () => {
                    const o = RouteUtils.getGraphhopperBusParams(end, start, time, arriveBy);
                    expect(o).toHaveProperty('elevation', false);
                    expect(o).toHaveProperty('point', [start, end]);
                    expect(o).toHaveProperty('points_encoded', false);
                    expect(o).toHaveProperty('vehicle', 'pt');
                    expect(o).toHaveProperty('weighting', 'short_fastest');
                    expect(o['pt.arrive_by']).toBe(arriveBy);
                    expect(o['ch.disable']).toBe(true);
                    expect(o['pt.walk_speed']).toBe(3.0);
                    expect(o['pt.earliest_departure_time']).toBeTruthy();
                    expect(o['pt.profile']).toBe(true);
                    expect(o['pt.max_walk_distance_per_leg']).toBe(2000);
                });
                test('RouteUtils.getGraphhopperWalkingParams', async () => {
                    const o = RouteUtils.getGraphhopperWalkingParams(end, start);
                    expect(o).toHaveProperty('point', [start, end]);
                    expect(o).toHaveProperty('points_encoded', false);
                    expect(o).toHaveProperty('vehicle', 'foot');
                });
                test('RouteUtils.getDepartureTime', async () => {
                    // TODO check departure time is the same as in the request
                    expect(typeof RouteUtils.getDepartureTime(time, arriveBy)).toBe('number');
                });
                test('RouteUtils.getDepartureTimeDateNow', async () => {
                    // TODO check departure time is the same as in the request
                    expect(typeof RouteUtils.getDepartureTimeDateNow(time, arriveBy)).toBe('string');
                });

                fetchRouteData = RouteUtils.fetchRoutes(end, start, time, arriveBy);

                test('RouteUtils.fetchRoutes.busRoute', async () => {
                    fetchRouteData = await fetchRouteData;

                    const { busRoute } = fetchRouteData;

                    expect(fetchRouteData).toHaveProperty('busRoute');
                    expect(busRoute).toHaveProperty('hints');
                    expect(busRoute).toHaveProperty('paths');
                    expect(busRoute.paths.length).toBeGreaterThan(0);
                    expect(busRoute.paths[0]).toHaveProperty('instructions');
                    expect(busRoute.paths[0].instructions.length).toBeGreaterThan(0);
                    expect(busRoute.paths[0]).toHaveProperty('transfers');
                    expect(busRoute.paths[0]).toHaveProperty('legs');
                    expect(busRoute.paths[0]).toHaveProperty('time');
                    expect(busRoute.paths[0]).toHaveProperty('snapped_waypoints');
                    expect(busRoute.paths[0]).toHaveProperty('ascend', 0);
                });

                test('RouteUtils.fetchRoutes.walkingRoute', async () => {
                    fetchRouteData = await fetchRouteData;

                    const { walkingRoute } = fetchRouteData;

                    expect(fetchRouteData).toHaveProperty('walkingRoute');
                    expect(walkingRoute).toHaveProperty('hints');
                    expect(walkingRoute).toHaveProperty('paths');
                    expect(walkingRoute.paths.length).toBeGreaterThan(0);
                    expect(walkingRoute.paths[0]).toHaveProperty('instructions');
                    expect(walkingRoute.paths[0].instructions.length).toBeGreaterThan(0);
                    expect(walkingRoute.paths[0]).toHaveProperty('transfers');
                    expect(walkingRoute.paths[0]).toHaveProperty('legs');
                    expect(walkingRoute.paths[0]).toHaveProperty('time');
                    expect(walkingRoute.paths[0]).toHaveProperty('snapped_waypoints');
                    expect(walkingRoute.paths[0]).toHaveProperty('ascend', 0);
                });
            });

            describe('ParseRouteUtils', () => {
                test('ParseRouteUtils.parseWalkingRoute', async () => {
                    fetchRouteData.walkingRoute = ParseRouteUtils.parseWalkingRoute(fetchRouteData.walkingRoute, RouteUtils.getDepartureTime(time, arriveBy), destinationName);

                    const { walkingRoute } = fetchRouteData;

                    expect(walkingRoute).toHaveProperty('departureTime');
                    expect(walkingRoute).toHaveProperty('directions');
                    expect(walkingRoute.directions.length).toBeGreaterThan(0);
                    expect(walkingRoute).toHaveProperty('startCoords');
                    expect(walkingRoute).toHaveProperty('endCoords');
                    expect(walkingRoute).toHaveProperty('boundingBox');
                    expect(walkingRoute).toHaveProperty('numberOfTransfers');
                });
            });
        });
    });
});
