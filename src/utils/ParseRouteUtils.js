// @flow

import createGpx from 'gps-to-gpx';
import geolib from 'geolib';
import ErrorUtils from './LogUtils';
import RequestUtils from './RequestUtils';
import TCATUtils from './GTFSUtils';
import RealtimeFeedUtils from './RealtimeFeedUtils';
import AllStopUtils from './AllStopUtils';

const ONE_HOUR_MS = 3600000;
const METERS_TO_MILES = 0.00062137119;

/**
 * distanceBetweenPoints(point1, point2) returns the distance between two points in miles
 * using the Haversine formula
 */
function distanceBetweenPointsMiles(point1: Object, point2: Object): number {
    const radlat1 = Math.PI * point1.lat / 180;
    const radlat2 = Math.PI * point2.lat / 180;
    const theta = point1.long - point2.long;
    const radtheta = Math.PI * theta / 180;
    let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    dist = Math.acos(dist);
    dist = dist * 180 / Math.PI;
    dist = dist * 60 * 1.1515;
    return dist;
}

function createGpxJson(stops: Array<Object>, startTime: String): Object {
    const waypoints = stops.map(stop => ({
        latitude: stop.lat,
        longitude: stop.long,
        elevation: 0,
        time: startTime,
    }));
    return {
        activityType: 'GraphHopper Track',
        startTime,
        waypoints,
    };
}

/**
 * Merge two dirctions
 * @param first
 * @param second
 * @returns {{type: *, name: *, startTime: *, endTime: *,
 * startLocation: ({lat: *, long: *}|*),
 * endLocation: ({lat: *, long: *}|*),
 * path: T[] | string | *, distance: *,
 * routeNumber: (null|*), stops: T[], tripIdentifiers: T[] | string | *}}
 */
function mergeDirections(first, second) {
    try {
        second.stops.shift();

        second.path.shift();
        const path = first.path.concat(second.path);
        const distance = first.distance + second.distance;
        const stops = first.stops.concat(second.stops);
        const tripIDs = first.tripIdentifiers.concat(second.tripIdentifiers);
        return {
            type: first.type,
            name: first.name,
            startTime: first.startTime,
            endTime: second.endTime,
            startLocation: first.startLocation,
            endLocation: second.endLocation,
            path,
            distance,
            routeNumber: first.routeNumber,
            stops,
            tripIdentifiers: tripIDs,
        };
    } catch (error) {
        throw new Error(
            ErrorUtils.logErr(error, { first, second }, 'mergeDirections failed'),
        );
    }
}

/**
 * Trims first and/or last directions if they are unnecessary walking directions
 * @param route
 * @param startCoords
 * @param endCoords
 * @returns {Promise<void>}
 */
async function trimFirstLastDirections(route, startCoords, endCoords) {
    const minWalkingDirDistanceMeters = 45.0;

    // if the direction walking distance is < minWalkingDirDistanceMeters
    if (route.directions[0].distance < minWalkingDirDistanceMeters) {
        const startLocIsStop = await AllStopUtils.isStopsWithinPrecision(
            startCoords,
            AllStopUtils.DEG_WALK_PRECISION,
        );

        if (startLocIsStop) {
            route.directions.shift();
        }
    }

    if (route.directions[route.directions.length - 1].distance < minWalkingDirDistanceMeters) {
        const endLocIsStop = await AllStopUtils.isStopsWithinPrecision(
            endCoords,
            AllStopUtils.DEG_WALK_PRECISION,
        );

        if (endLocIsStop) {
            route.directions.pop();
        }
    }
}

/**
 * - Removes unnecessary start and end directions (walking directions to stops <15 feet away)
 * - Merges directions that indicate an on-bus change in route-IDs where no action required
 * - Checks route walking distance does not exceed specified maximum
 * - Checks user can make the bus
 * - Checks directions not excessively long
 * @param route
 * @param startCoords
 * @param endCoords
 * @param maxWalkingDistance
 * @param departureDelayBuffer
 * @param departureTimeNowMs
 * @returns {Object}
 */
async function condenseRoute(
    route: Object,
    startCoords: Object,
    endCoords: Object,
    maxWalkingDistance: ?number = 9999,
    departureDelayBuffer: ?boolean = false,
    departureTimeNowMs: number,
) {
    try {
        // trim unnecessary walking directions
        await trimFirstLastDirections(route, startCoords, endCoords);

        let previousDirection = null;
        let totalDistanceWalking = 0;

        for (let index = 0; index < route.directions.length; index++) {
            const direction = route.directions[index];
            const startTime = Date.parse(direction.startTime);
            const endTime = Date.parse(direction.endTime);
            /*
             * Discard routes with directions that take over 2 hours time
             */
            if (startTime + (ONE_HOUR_MS * 2) <= endTime) {
                return null;
            }

            /*
             * Discard routes where not possible to walk to bus given departure buffer
             */
            if (departureDelayBuffer) {
                if (direction.type === 'depart') {
                    const busActualDepartTime = startTime + (direction.delay != null ? direction.delay * 1000 : 0);
                    if (busActualDepartTime < departureTimeNowMs) {
                        return null;
                    }
                }
            }

            if (previousDirection
                && previousDirection.type === 'depart'
                && direction.type === 'depart') {
                /*
                 * Discard route if a depart direction's last stopID is not the same as the next direction's first stopID,
                 * Fixes bug where graphhopper directions are to get off at a stop and get on another stop
                 * far away with no walking direction in between, EG: 1. get off at Statler 2. board at RPCC
                 */
                if (previousDirection.stops[previousDirection.stops.length - 1].stopID
                !== direction.stops[0].stopID) {
                    return null;
                }

                /*
                 * If consecutive bus directions have the same routeNumber,
                 * then replace the last direction with merged directions and remove the current direction.
                 * No real transfer, probably just change in trip_ids.
                 */
                if (previousDirection.routeNumber === direction.routeNumber) {
                    route.directions.splice(index - 1, 2, mergeDirections(previousDirection, direction));
                    index -= 1; // since we removed an element from the array
                }

                /*
                 * Discard routes with over 1 hours time waiting between each direction
                 */
                if (previousDirection) {
                    const prevEndTime = Date.parse(previousDirection.endTime);
                    if (prevEndTime + ONE_HOUR_MS < startTime) {
                        return null;
                    }
                }
            }
            if (direction.type === 'walk') {
                totalDistanceWalking += direction.distance;
            }

            previousDirection = direction;
        }

        // if a bus route has more walking distance than the walking route, discard route
        // or route has 0 directions
        if (totalDistanceWalking > maxWalkingDistance || route.directions.length === 0) {
            return null;
        }
    } catch (error) {
        throw new Error(
            ErrorUtils.logErr(error, route, 'Condense final route failed'),
        );
    }

    return route;
}

function parseWalkingRoute(data: any, startDateMs: number, destinationName: string) {
    try {
        const path = data.paths[0];
        const endDateMs = startDateMs + path.time;

        const departureTime = `${new Date(startDateMs).toISOString()
            .split('.')[0]}Z`;
        const arrivalTime = `${new Date(endDateMs).toISOString()
            .split('.')[0]}Z`;

        const startCoords = {
            lat: path.points.coordinates[0][1],
            long: path.points.coordinates[0][0],
        };

        const endCoords = {
            lat: path.points.coordinates[path.points.coordinates.length - 1][1],
            long: path.points.coordinates[path.points.coordinates.length - 1][0],
        };

        let boundingBox;
        if (path.distance === 0) {
            boundingBox = {
                minLat: startCoords.lat,
                minLong: startCoords.long,
                maxLat: endCoords.lat,
                maxLong: endCoords.long,
            };
            path.distance = 1;
        } else {
            boundingBox = {
                minLat: path.bbox[1],
                minLong: path.bbox[0],
                maxLat: path.bbox[3],
                maxLong: path.bbox[2],
            };
        }

        const numberOfTransfers = 0;

        const walkingPath = path.points.coordinates.map(point => ({
            lat: point[1],
            long: point[0],
        }));

        const direction = {
            type: 'walk',
            name: destinationName,
            startTime: departureTime,
            endTime: arrivalTime,
            startLocation: startCoords,
            endLocation: endCoords,
            path: walkingPath,
            distance: path.distance,
            routeNumber: null,
            stops: [],
            tripIdentifiers: null,
            delay: null,
        };

        return {
            departureTime,
            arrivalTime,
            directions: [direction],
            startCoords,
            endCoords,
            boundingBox,
            numberOfTransfers,
        };
    } catch (e) {
        throw new Error(
            ErrorUtils.logErr(e, { data, startDateMs, destinationName }, 'Parse walking route failed'),
        );
    }
}

/**
 * Transform route object from graphhopper into one readable by the client, an array of
 * five routes. Includes delay calculations, asynchronous.
 *
 * Example return object:
 [
 {  departureTime: '2018-10-22T03:44:19Z',
    arrivalTime: '2018-10-22T04:01:46Z',
    directions: [ [Object], [Object], [Object], [Object] ],
    startCoords: { lat: 42.441603931224435, long: -76.48638788207742 },
    endCoords: { lat: 42.45662677611252, long: -76.47693624444763 },
    boundingBox:
     { minLat: 42.441596,
       minLong: -76.490387,
       maxLat: 42.456818,
       maxLong: -76.471642 },
    numberOfTransfers: 1,
  },
 ...
  ]
 * @param resp
 * @param destinationName
 * @returns {Promise<Array>}
 */
function parseRoute(resp: Object, destinationName: string) {
    // array of parsed routes

    const { paths } = resp;

    return Promise.all(paths.map(async (currPath) => {
        try {
            // this won't increment if the passenger 'stays on bus'
            const numberOfTransfers = currPath.transfers;

            // array containing legs of journey. e.g. walk, bus ride, walk
            const { legs } = currPath;
            const numberOfLegs = legs.length;

            // string 2018-02-21T17:27:00Z
            const { departureTime } = legs[0];
            const arriveTime = legs[numberOfLegs - 1].arrivalTime;

            const startingLocationGeometry = legs[0].geometry;
            const endingLocationGeometry = legs[numberOfLegs - 1].geometry;

            const startingLocationLong = startingLocationGeometry.coordinates[0][0];
            const startingLocationLat = startingLocationGeometry.coordinates[0][1];

            const endingLocationLong = endingLocationGeometry.coordinates[endingLocationGeometry.coordinates.length - 1][0];
            const endingLocationLat = endingLocationGeometry.coordinates[endingLocationGeometry.coordinates.length - 1][1];

            const startCoords = {
                lat: startingLocationLat,
                long: startingLocationLong,
            };

            const endCoords = {
                lat: endingLocationLat,
                long: endingLocationLong,
            };

            const boundingBox = {
                minLat: currPath.bbox[1],
                minLong: currPath.bbox[0],
                maxLat: currPath.bbox[3],
                maxLong: currPath.bbox[2],
            };

            const directions = await Promise.all(legs.map(async (currLeg, j, legsArray) => {
                let { type } = currLeg;
                if (type === 'pt') {
                    type = 'depart';
                }

                let name = '';
                if (type === 'walk') {
                    // means we are at the last direction aka a walk. name needs to equal final destination
                    if (j === numberOfLegs - 1) {
                        name = destinationName;
                    } else {
                        name = legsArray[j + 1].departureLocation;
                    }
                } else if (type === 'depart') {
                    name = currLeg.departureLocation;
                }

                const startTime = currLeg.departureTime;
                const endTime = currLeg.arrivalTime;

                const currCoordinates = currLeg.geometry.coordinates;
                let path = currCoordinates.map(point => ({
                    lat: point[1],
                    long: point[0],
                }));

                const startLocation = path[0];
                const endLocation = path[path.length - 1];
                let routeNumber = null;
                let tripID = null;
                let delay = null;
                let stops = [];
                let stayOnBusForTransfer = false;

                const { distance } = currLeg;
                if (type === 'depart') {
                    if (currLeg.isInSameVehicleAsPrevious) {
                        // last depart was a transfer
                        stayOnBusForTransfer = true;
                    }

                    tripID = [currLeg.trip_id];

                    const routeJson = await TCATUtils.routesJson;
                    const route = routeJson.filter(routeObj => routeObj.route_id.toString() === currLeg.route_id.toString());

                    path = currLeg.stops.map(stop => ({
                        lat: stop.geometry.coordinates[1],
                        long: stop.geometry.coordinates[0],
                    }));

                    if (route.length === 1) {
                        // this gets the correct route number for the gtfs data
                        routeNumber = route[0].route_short_name.match(/\d+/g)
                            .map(Number)[0];
                    }

                    if (path.length >= 2) {
                        // Map Matching
                        const firstStopCoords = path[0];
                        const lastStopCoords = path[path.length - 1];
                        const gpxJson = createGpxJson(path, startTime);
                        const gpx = createGpx(gpxJson.waypoints, {
                            activityName: gpxJson.activityType,
                            startTime: gpxJson.startTime,
                        });

                        try {
                            // TODO refactor
                            // eslint-disable-next-line no-await-in-loop

                            const options = {
                                method: 'POST',
                                url: `http://${process.env.MAP_MATCHING || 'ERROR'}:8989/match`,
                                body: gpx,
                                headers: {
                                    'Content-Type': 'application/xml',
                                },
                                qs: {
                                    points_encoded: false,
                                    vehicle: 'car',
                                },
                            };

                            // eslint-disable-next-line no-await-in-loop
                            const snappingResponseRequest = await RequestUtils.createRequest(
                                options, 'snappingResponse request failed',
                            );

                            let snappingResponse = null;

                            if (snappingResponseRequest) {
                                snappingResponse = JSON.parse(snappingResponseRequest);

                                // need to handle errors more gracefully
                                path = snappingResponse.paths[0].points.coordinates.map(point => ({
                                    lat: point[1],
                                    long: point[0],
                                }));
                            }
                        } catch (error) {
                            // log error
                            ErrorUtils.logErr(error, destinationName, `Snap response failed: ${process.env.MAP_MATCHING || 'undefined graphhopper mapmatching env'}`);
                        }

                        // Trim Coordinates so they start/end at bus stops
                        const startDistanceArray = path.map(point2 => distanceBetweenPointsMiles(firstStopCoords, point2));

                        const endDistanceArray = path.map(point2 => distanceBetweenPointsMiles(lastStopCoords, point2));

                        const startIndex = startDistanceArray.indexOf(Math.min(...startDistanceArray));
                        const endIndex = endDistanceArray.indexOf(Math.min(...endDistanceArray));

                        path = path.slice(startIndex, endIndex);
                        path.unshift(firstStopCoords);
                        path.push(lastStopCoords);
                    }

                    // create all stops array
                    stops = currLeg.stops.map(stop => ({
                        name: stop.stop_name,
                        lat: stop.geometry.coordinates[1],
                        long: stop.geometry.coordinates[0],
                        stopID: stop.stop_id,
                    }));

                    const realtimeData = RealtimeFeedUtils.getTrackingInformation(
                        stops[0].stopID,
                        tripID[0],
                        (await RealtimeFeedUtils.realtimeFeed),
                    );

                    delay = (realtimeData && realtimeData.delay);
                }

                return {
                    type,
                    name,
                    startTime,
                    endTime,
                    startLocation,
                    endLocation,
                    path,
                    distance,
                    routeNumber,
                    stops,
                    tripIdentifiers: tripID,
                    delay,
                    stayOnBusForTransfer,
                };
            }));

            return {
                departureTime,
                arrivalTime: arriveTime,
                directions,
                startCoords,
                endCoords,
                boundingBox,
                numberOfTransfers,
            };
        } catch (error) {
            throw new Error(
                ErrorUtils.logErr(error, paths.length, 'Parse final route failed'),
            );
        }
    }));
}

/**
 * Return a more detailed route information returned from parseRoute function,
 * including travelDistance, totalDuration, and routeSummary.
 *
 * Example return object:
 [
 {  departureTime: '2018-10-22T03:44:19Z',
    arrivalTime: '2018-10-22T04:01:46Z',
    directions: [ [Object], [Object], [Object], [Object] ],
    startCoords: { lat: 42.441603931224435, long: -76.48638788207742 },
    endCoords: { lat: 42.45662677611252, long: -76.47693624444763 },
    startName: 'Risley Hall - Shelter',
    endName: 'Ithaca Commons - Seneca St',
    boundingBox:
     { minLat: 42.441596,
       minLong: -76.490387,
       maxLat: 42.456818,
       maxLong: -76.471642 },
    travalDistance: 1231,
    totalDuration: 12,
    numberOfTransfers: 1,
    routeSummary: [...],
  },
 ...
  ]
 * @param resp
 * @param destinationName
 * @returns {Promise<Array>}
 */
async function parseDetailedRoute(resp: Object, destinationName: string) {
    const paths = await parseRoute(resp, destinationName);
    
    return paths.map((currPath) => {
        const {
            departureTime,
            arrivalTime,
            directions,
            startCoords,
            endCoords,
            boundingBox,
            numberOfTransfers,
        } = currPath;

        let travelDistance = geolib.getDistance(
            { latitude: startCoords.lat, longitude: startCoords.long },
            { latitude: endCoords.lat, longitude: endCoords.long }
        );

        travelDistance *= METERS_TO_MILES;
        currPath.travelDistance = travelDistance;

        let totalDuration = new Date(arrivalTime) - new Date(departureTime);
        totalDuration /= 1000;
        totalDuration /= 60;
        currPath.totalDuration = Math.round(totalDuration);

        currPath.startName = currPath.directions[0].name;
        currPath.endName = destinationName;

        // routeSummary

        /* routeSummaryElement {
            stopName: String,
            direction: RouteSummaryDirection?,
            shouldStayOnBus: Bool,
        }
        */

        /* routeSummaryDirection {
            type: null || 'walk' || 'bus',
            routeNumber: null || Int,
        }
        */

        let routeSummary = [];

        let walkOnlyRoute = true;
        for (let i = 0; i < directions.length; i++) {
            walkOnlyRoute = walkOnlyRoute && (directions[i].type === 'walk');
        }

        // if walk only route, the first element of routeSummary will be 'walk'
        if (walkOnlyRoute) {
            routeSummary.push({
                stopName: directions[0].name,
                direction: { type: 'walk', routeNumber: null },
                shouldStayOnBus: false,
            });
            routeSummary.push({
                stopName: directions[directions.length - 1].name,
                direction: { type: null, routeNumber: null },
                shouldStayOnBus: false,
            });
        } else {
            let indexOfFirstBus = -1;
            for (let i = 0; i < directions.length; i++) {
                if (directions[i].type === 'depart') {
                    indexOfFirstBus = i;
                    break;
                }
            }

            for (let i = indexOfFirstBus; i < directions.length; i++) {
                let newRouteSummary = { stopName: directions[i].name, shouldStayOnBus: false };
                switch (directions[i].type) {
                    case 'depart':
                        newRouteSummary.direction = { type: 'bus', routeNumber: directions[i].routeNumber };
                        break;
                    case 'walk':
                        newRouteSummary.direction = { type: 'walk', routeNumber: null };
                        break;
                    default:
                        break;
                }
                routeSummary.push(newRouteSummary);
            }

            routeSummary.push({
                stopName: directions[directions.length - 1].name,
                direction: { type: null, routeNumber: null },
                shouldStayOnBus: false,
            });
        }

        currPath.routeSummary = routeSummary;

        return currPath;
    });
}

export default {
    parseWalkingRoute,
    parseRoute,
    parseDetailedRoute,
    condenseRoute,
};
