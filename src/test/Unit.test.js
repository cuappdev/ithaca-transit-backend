/* eslint-disable no-underscore-dangle */
const ChronicleSession = require('../appdev/ChronicleSession').default;
const ParseRouteUtils = require('../utils/ParseRouteUtils').default;
// eslint-disable-next-line no-unused-vars
const TestUtils = require('./TestUtils');
const {
    routeTests,
} = require('./TestGlobals').default;
const RouteUtils = require('../utils/RouteUtils.js').default;
const RouteUtilsV2 = require('../utils/RouteUtilsV2.js').default;
const GhopperUtils = require('../utils/GraphhopperUtils.js').default;

describe('Route unit tests', () => {
    beforeAll(async () => {
        await GhopperUtils.ghopperReady;
    }, 1200000);

    routeTests.forEach((routeParams) => {
        describe(routeParams.name, () => {
            const { arriveBy, destinationName } = routeParams.params;
            let { end, start } = routeParams.params;
            const { time } = routeParams;
            end = `${end.lat},${end.long}`;
            start = `${start.lat},${start.long}`;
            let fetchRouteData;

            describe('RouteUtils', () => {
                test('RouteUtils.getGraphhopperBusParams', () => {
                    const o = GhopperUtils.getGraphhopperBusParams(end, start, time, arriveBy);
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
                test('RouteUtils.getGraphhopperWalkingParams', () => {
                    const o = GhopperUtils.getGraphhopperWalkingParams(end, start);
                    expect(o).toHaveProperty('point', [start, end]);
                    expect(o).toHaveProperty('points_encoded', false);
                    expect(o).toHaveProperty('vehicle', 'foot');
                });
                test('RouteUtils.getDepartureTime', () => {
                    // TODO check departure time is the same as in the request
                    const t = GhopperUtils.getDepartureTime(time, arriveBy);
                    // console.log(moment(time).format());
                    // console.log(moment(t).format());
                    expect(typeof t).toBe('number');
                    expect(typeof t).toBe('number');
                });
                test('RouteUtils.getDepartureTimeDateNow', () => {
                    // TODO check departure time is the same as in the request
                    // console.log(moment(time).format());
                    // console.log(moment(RouteUtils.getDepartureTimeDateNow(time, arriveBy)).format());
                    expect(typeof GhopperUtils.getDepartureTimeDateNow(time, arriveBy)).toBe('string');
                });

                fetchRouteData = GhopperUtils.fetchRoutes(end, start, time, arriveBy);

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
                    expect(busRoute.paths[0]).toHaveProperty('distance');
                    expect(busRoute.paths[0]).toHaveProperty('bbox');
                    expect(busRoute.paths[0]).toHaveProperty('weight');
                    expect(busRoute.paths[0]).toHaveProperty('points');
                    expect(busRoute.paths[0]).toHaveProperty('points_encoded', false);
                    expect(busRoute.paths[0]).toHaveProperty('legs');
                    expect(busRoute.paths[0]).toHaveProperty('fare');
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
                    expect(walkingRoute.paths[0]).toHaveProperty('distance');
                    expect(walkingRoute.paths[0]).toHaveProperty('bbox');
                    expect(walkingRoute.paths[0]).toHaveProperty('weight');
                    expect(walkingRoute.paths[0]).toHaveProperty('points');
                    expect(walkingRoute.paths[0]).toHaveProperty('points_encoded', false);
                    expect(walkingRoute.paths[0]).toHaveProperty('legs');
                });
            });

            const checkDirectionValid = (dir) => {
                expect(dir).toHaveProperty('name');
                expect(dir).toHaveProperty('startTime');
                expect(dir).toHaveProperty('endTime');
                expect(dir).toHaveProperty('startLocation');
                expect(dir).toHaveProperty('endLocation');
                expect(dir).toHaveProperty('type');

                if (dir.type === 'walk') {
                    expect(dir).toHaveProperty('routeNumber', null);
                    expect(dir).toHaveProperty('stops', []);
                    expect(dir).toHaveProperty('tripIdentifiers', null);
                } else {
                    expect(dir).toHaveProperty('type', 'depart');
                    expect(dir).toHaveProperty('routeNumber');
                    expect(dir).toHaveProperty('tripIdentifiers');
                    expect(dir).toHaveProperty('stops');
                    expect(dir.stops.length).toBeGreaterThan(0);
                    expect(dir.stops[0]).toHaveProperty('stopID');
                    expect(dir.stops[0]).toHaveProperty('name');
                }

                expect(dir).toHaveProperty('distance');
                expect(dir.distance).toBeGreaterThan(0);

                expect(dir).toHaveProperty('path');
                expect(dir.path.length).toBeGreaterThan(0);
                expect(dir.path[0]).toHaveProperty('lat');
                expect(dir.path[0]).toHaveProperty('long');
            };

            const checkRouteValid = (route) => {
                expect(route).toHaveProperty('departureTime');
                expect(route).toHaveProperty('arrivalTime');
                expect(route).toHaveProperty('startCoords');
                expect(route).toHaveProperty('endCoords');
                expect(route).toHaveProperty('boundingBox');
                expect(route).toHaveProperty('numberOfTransfers');
                expect(route).toHaveProperty('directions');
                expect(route.directions.length).toBeGreaterThan(0);
                for (let j = 0; j < route.directions.length; j++) {
                    checkDirectionValid(route.directions[j]);
                }
            };

            describe('ParseRouteUtils', () => {
                test('ParseRouteUtils.parseWalkingRoute', async () => {
                    await fetchRouteData;
                    fetchRouteData.walkingRoute = ParseRouteUtils.parseWalkingRoute(
                        fetchRouteData.walkingRoute,
                        GhopperUtils.getDepartureTime(time, arriveBy),
                        destinationName,
                    );

                    const { walkingRoute } = fetchRouteData;

                    checkRouteValid(walkingRoute);
                });

                test('ParseRouteUtils.parseRoute', async () => {
                    await fetchRouteData;
                    fetchRouteData.busRoute = await ParseRouteUtils.parseRoute(
                        fetchRouteData.busRoute,
                        destinationName,
                    );

                    const { busRoute } = fetchRouteData;

                    expect(busRoute.length).toBeGreaterThan(0);

                    for (let i = 0; i < busRoute.length; i++) {
                        checkRouteValid(busRoute[i]);
                    }
                });

                test('ParseRouteUtils.filterRoute', async () => {
                    await fetchRouteData;
                    const finalRoute = await RouteUtils.createFinalRoute(
                        fetchRouteData.busRoute,
                        fetchRouteData.walkingRoute,
                        start,
                        end,
                        time,
                        arriveBy,
                    );

                    for (let i = 0; i < finalRoute.length; i++) {
                        checkRouteValid(finalRoute[i]);
                    }
                });
            });

            describe('RouteUtilsV2', () => {
                test('RouteUtilsV2.getRoute', async () => {
                    const o = await RouteUtilsV2.getRoute(destinationName, end, start, time, arriveBy);
                    console.log('Here is the V2 output');
                    console.log(o);
                    expect(1).toBe(1);
                });
            });
        });
    });
});

describe('Appdev dependencies tests', () => {
    describe('ChronicleSession', () => {
        let chronicle;
        test('new ChronicleSession', () => {
            chronicle = new ChronicleSession();
        });
    });
});
