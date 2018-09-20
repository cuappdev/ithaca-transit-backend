// @flow
import axios from 'axios';
import createGpx from 'gps-to-gpx';
import TCATUtils from './TCATUtils';
import RealtimeFeedUtils from './RealtimeFeedUtils';
import AllStopUtils from './AllStopUtils';
import ErrorUtils from './ErrorUtils';

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
}

function condense(route: Object, startCoords: Object, endCoords: Object) {
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
    return route;
}

async function parseRoute(resp: Object, destinationName: string) {
    // array of parsed routes
    const possibleRoutes = [];

    const { paths } = resp;

    for (let index = 0; index < paths.length; index++) {
        const currPath = paths[index];

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
        for (let j = 0; j < numberOfLegs; j++) {
            const currLeg = legs[j];
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
                    name = legs[j + 1].departureLocation;
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
                const route = TCATUtils.routeJson.filter(routeObj => routeObj.route_id === currLeg.route_id);

                path = currLeg.stops.map(stop => ({
                    lat: stop.geometry.coordinates[1],
                    long: stop.geometry.coordinates[0],
                }));

                if (route.length === 1) {
                    // this gets the correct route number for the gtfs data
                    routeNumber = parseInt(route[0].route_short_name);
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

                    const config = {
                        headers: {
                            'Content-Type': 'application/xml',
                        },
                        params: {
                            points_encoded: false,
                            vehicle: 'car',
                        },
                    };
                    try {
                        // TODO refactor
                        // eslint-disable-next-line no-await-in-loop
                        const snappingResponse = await axios.post(`http://${process.env.MAP_MATCHING || 'ERROR'}:8989/match`, gpx, config);
                        // need to handle errors more gracefully
                        path = snappingResponse.data.paths[0].points.coordinates.map(point => ({
                            lat: point[1],
                            long: point[0],
                        }));
                    } catch (error) {
                        // log error
                        ErrorUtils.log(error.data, destinationName, `Snap response failed: ${process.env.MAP_MATCHING || 'undefined graphhopper mapmatching env'}`);
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

                delay = RealtimeFeedUtils.getDelay(stops[0].stopID, tripID[0]);
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
        }

        possibleRoutes.push({
            departureTime,
            arrivalTime: arriveTime,
            directions,
            startCoords,
            endCoords,
            boundingBox,
            numberOfTransfers,
        });
    }
    return possibleRoutes;
}

export default {
    parseRoute,
    condense,
};
