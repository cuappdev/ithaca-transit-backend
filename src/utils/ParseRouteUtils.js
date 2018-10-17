// @flow

import createGpx from 'gps-to-gpx';
import ErrorUtils from './LogUtils';
import RequestUtils from './RequestUtils';
import TCATUtils from './TCATUtils';
import RealtimeFeedUtils from './RealtimeFeedUtils';
import AllStopUtils from './AllStopUtils';

const ONE_HOUR_MS = 3600000;

/**
 * distanceBetweenPoints(point1, point2) returns the distance between two points in miles
 */
function distanceBetweenPoints(point1: Object, point2: Object): number {
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

function condense(route: Object, startCoords: Object, endCoords: Object) {
    try {
        const updatedDirections = [];

        const canFirstDirectionBeRemoved = AllStopUtils.isStop(startCoords, route.directions[0].name, route.directions[0].distance);
        const canLastDirectionBeRemoved = AllStopUtils.isStop(endCoords,
            route.directions[route.directions.length - 1].name, route.directions[route.directions.length - 1].distance);
        if (canFirstDirectionBeRemoved) {
            route.directions.shift();
        }
        if (canLastDirectionBeRemoved) {
            route.directions.pop();
        }

        for (let index = 0; index < route.directions.length; index++) {
            const direction = route.directions[index];
            if (index !== 0) {
                const firstDirection = route.directions[index - 1];
                const secondDirection = route.directions[index];
                if (direction.type === 'depart' && route.directions[index - 1].type === 'depart') {
                    // if we are here, we have a possible merge
                    if (firstDirection.routeNumber === secondDirection.routeNumber) {
                        // this means both directions have the same routeNumber.
                        // No real transfer, probably just change in trip_ids
                        const combinedDirection = mergeDirections(firstDirection, secondDirection);
                        updatedDirections.pop();
                        updatedDirections.push(combinedDirection);
                    } else {
                        updatedDirections.push(direction);
                    }
                } else {
                    updatedDirections.push(direction);
                }
            } else {
                updatedDirections.push(direction);
            }
        }
        route.directions = updatedDirections;
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

        const boundingBox = {
            minLat: path.bbox[1],
            minLong: path.bbox[0],
            maxLat: path.bbox[3],
            maxLong: path.bbox[2],
        };

        const startCoords = {
            lat: path.points.coordinates[0][1],
            long: path.points.coordinates[0][0],
        };

        const endCoords = {
            lat: path.points.coordinates[path.points.coordinates.length - 1][1],
            long: path.points.coordinates[path.points.coordinates.length - 1][0],
        };

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

async function parseRoute(resp: Object, destinationName: string) {
    // array of parsed routes
    const possibleRoutes = [];

    const { paths } = resp;

    await Promise.all(paths.map(async (currPath, index, pathsArray) => {
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

            const directions: Array<Object> = [];

            await Promise.all(legs.map(async (currLeg, j, legsArray) => {
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
                        routeNumber = route[0].route_short_name.match(/\d+/g).map(Number)[0];
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
                        const startDistanceArray = path.map(point2 => distanceBetweenPoints(firstStopCoords, point2));

                        const endDistanceArray = path.map(point2 => distanceBetweenPoints(lastStopCoords, point2));

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

                    delay = (realtimeData && realtimeData.delay) || 0;
                }

                directions.push({
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
                });
            }));

            possibleRoutes.push({
                departureTime,
                arrivalTime: arriveTime,
                directions,
                startCoords,
                endCoords,
                boundingBox,
                numberOfTransfers,
            });
        } catch (error) {
            throw new Error(
                ErrorUtils.logErr(error, paths.length, 'Parse final route failed'),
            );
        }
    }));

    return possibleRoutes;
}

/* eslint-disable no-param-reassign */
function filterRoute(routeNow, routeWalking, start, end, departureTimeQuery, arriveBy) {
    const departureTimeNowMs = parseFloat(departureTimeQuery) * 1000;
    let departureDelayBuffer: boolean = false;
    const departureTimeNowActualMs = departureTimeNowMs;
    if (!arriveBy) { // 'leave at' query
        departureDelayBuffer = true;
    }

    routeNow = routeNow.filter((route) => {
        let isValid = true;
        for (let index = 1; index < route.directions.length; index++) {
            if (route.directions[index].type === 'depart' && route.directions[index - 1].type === 'depart') {
                const firstPT = route.directions[index - 1];
                const secondPT = route.directions[index];
                isValid = firstPT.stops[firstPT.stops.length - 1].stopID === secondPT.stops[0].stopID;
            }
        }
        return isValid;
    });

    const routePointParams = start.split(',').concat(end.split(','));

    routeNow = routeNow.map(route => condense(route,
        { lat: routePointParams[0], long: routePointParams[1] },
        { lat: routePointParams[2], long: routePointParams[3] }));

    // now need to compare if walking route is better
    routeNow = routeNow.filter((route) => {
        // only show walking directions
        const walkingDirections = route.directions.filter(direction => direction.type === 'walk');
        const walkingTotals = walkingDirections.map(walk => walk.distance);
        let totalDistanceWalkingForRoute = 0;
        walkingTotals.forEach((element) => {
            totalDistanceWalkingForRoute += element;
        });
        // console.log(route);
        // console.log(totalDistanceWalkingForRoute <= routeWalking.directions[0].distance);
        return totalDistanceWalkingForRoute <= (routeWalking ? routeWalking.directions[0].distance : 9999);
    });

    if (routeNow.length === 0 && routeWalking) {
        return routeWalking ? [routeWalking] : [];
    }

    // throw out routes with over 2 hours time between each direction
    // also throw out routes that will depart before the query time if query is for 'leave at'
    routeNow = routeNow.filter((route) => {
        let keepRoute = true;
        for (let index = 0; index < route.directions.length; index++) {
            const direction = route.directions[index];
            const startTime = Date.parse(direction.startTime);
            const endTime = Date.parse(direction.endTime);
            if (startTime + (ONE_HOUR_MS * 2) <= endTime) {
                keepRoute = false;
            }

            if (index !== 0) { // means we can access the previous direction endTime
                const prevEndTime = Date.parse(route.directions[index - 1].endTime);
                if (prevEndTime + ONE_HOUR_MS < startTime) {
                    keepRoute = false;
                }
            }
            if (departureDelayBuffer) { // make sure user can catch the bus
                if (direction.type === 'depart') {
                    const busActualDepartTime = startTime + (direction.delay != null ? direction.delay * 1000 : 0);
                    if (busActualDepartTime < departureTimeNowActualMs) {
                        keepRoute = false;
                    }
                }
            }
        }
        return keepRoute;
    });

    return routeNow;
}

export default {
    parseWalkingRoute,
    parseRoute,
    filterRoute,
};
