// @flow
import axios from 'axios';
import qs from 'qs';
import createGpx from 'gps-to-gpx';
import type Request from 'express';
import TCATUtils from './TCATUtils';
import RealtimeFeedUtils from './RealtimeFeedUtils';
import WalkingUtils from './WalkingUtils';
import AllStopUtils from './AllStopUtils';

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

/**
 * Returns an array of the best available routes based on
 * the parameters passed in.
 * @param {Request} req - The request containing the parameters
 * @param {boolean} multiroute - If getRoutes is being called by a multiroute router
 * @param {number} whichDest - The index of the destination we want routes for (multiroute only)
 * @todo better documentation
 */
async function getRoutes(req: Request, multiroute: boolean = false, whichDest : number = 0): Promise<Array<Object>> {
    let { destinationName, end, start } = req.query;
    // if multiroute with multiple destinations,
    // want the route for the destination corresponding to whichDest
    if (multiroute && typeof destinationName !== 'string') {
        destinationName = destinationName[whichDest];
        end = end[whichDest];
    }
    const arriveBy: boolean = req.query.arriveBy === '1';
    const departureTimeQuery: string = req.query.time;
    let departureTimeNowMs = parseFloat(departureTimeQuery) * 1000;
    let departureDelayBuffer: boolean = false;
    const departureTimeNowActualMs = departureTimeNowMs;
    if (!arriveBy) { // 'leave at' query
        departureDelayBuffer = true;
        const delayBuffer = 5; // minutes
        departureTimeNowMs = departureTimeNowActualMs - delayBuffer * 60 * 1000; // so we can potentially display delayed routes
    }
    const departureTimeDateNow = new Date(departureTimeNowMs).toISOString();
    const oneHourInMilliseconds = 3600000;

    const parameters: any = {
        vehicle: 'pt',
        weighting: 'short_fastest',
        elevation: false,
        point: [start, end],
        points_encoded: false,
    };
    parameters['pt.arrive_by'] = arriveBy;
    parameters['ch.disable'] = true;

    // if this was set to > 3.0, sometimes the route would suggest getting off bus earlier and walk half a mile instead of waiting longer
    parameters['pt.walk_speed'] = 3.0;
    parameters['pt.earliest_departure_time'] = departureTimeDateNow;
    parameters['pt.profile'] = true;
    parameters['pt.max_walk_distance_per_leg'] = 2000;

    const walkingParameters: any = {
        vehicle: 'foot',
        point: [start, end],
        points_encoded: false,
    };

    let busRoute;
    let walkingRoute;

    try {
        busRoute = await axios.get(`http://${process.env.GHOPPER_BUS || 'ERROR'}:8988/route`, {
            params: parameters,
            paramsSerializer: (params: any) => qs.stringify(params, { arrayFormat: 'repeat' }),
        });
    } catch (routeErr) {
        console.log('routing error');
        TCATUtils.writeToRegister('routing_failed', { parameters: JSON.stringify(parameters) });
        busRoute = null;
    }

    try {
        walkingRoute = await axios.get(`http://${process.env.GHOPPER_WALKING || 'ERROR'}:8987/route`, {
            params: walkingParameters,
            paramsSerializer: (params: any) => qs.stringify(params, { arrayFormat: 'repeat' }),
        });
    } catch (walkingErr) {
        console.log('walking error');
        TCATUtils.writeToRegister('walking_failed', { parameters: JSON.stringify(walkingParameters) });
        walkingRoute = null;
        return [];
    }

    if (!busRoute && !walkingRoute) {
        return [];
    }

    const routeWalking = WalkingUtils.parseWalkingRoute(walkingRoute.data, departureTimeNowMs, destinationName);
    
    // if there are no bus routes, we should just return walking instead of crashing
    if (!busRoute) {
        return [routeWalking];
    }

    let routeNow = await parseRoute(busRoute.data, destinationName);

    routeNow = routeNow.filter((route) => {
        let isValid = true;
        for (let index = 0; index < route.directions.length; index++) {
            if (index !== 0 && route.directions[index].type === 'depart' && route.directions[index - 1].type === 'depart') {
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
        const walkingDirections = route.directions.filter(direction => direction.type === 'walk');
        const walkingTotals = walkingDirections.map(walk => walk.distance);
        let totalWalkingForRoute = 0;
        walkingTotals.forEach((element) => {
            totalWalkingForRoute += element;
        });
        return totalWalkingForRoute <= routeWalking.directions[0].distance;
    });

    if (routeNow.length === 0) {
        return [routeWalking];
    }
    // throw out routes with over 2 hours time between each direction
    // also throw out routes that will depart before the query time if query is for 'leave at'
    routeNow = routeNow.filter((route) => {
        let keepRoute = true;
        for (let index = 0; index < route.directions.length; index++) {
            const direction = route.directions[index];
            const startTime = Date.parse(direction.startTime);
            const endTime = Date.parse(direction.endTime);
            if (startTime + (oneHourInMilliseconds * 2) <= endTime) {
                keepRoute = false;
            }

            if (index !== 0) { // means we can access the previous direction endTime
                const prevEndTime = Date.parse(route.directions[index - 1].endTime);
                if (prevEndTime + oneHourInMilliseconds < startTime) {
                    keepRoute = false;
                }
            }

            if (departureDelayBuffer) { // make sure user can catch the bus
                if (direction.type === 'depart') {
                    const busActualDepartTime = startTime + (direction.delay !== null ? direction.delay * 1000 : 0);
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
        const amountOfLegs = legs.length;

        // string 2018-02-21T17:27:00Z
        const { departureTime } = legs[0];
        const arriveTime = legs[amountOfLegs - 1].arrivalTime;

        const startingLocationGeometry = legs[0].geometry;
        const endingLocationGeometry = legs[amountOfLegs - 1].geometry;

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
        for (let j = 0; j < amountOfLegs; j++) {
            const currLeg = legs[j];
            let { type } = currLeg;
            if (type === 'pt') {
                type = 'depart';
            }

            let name = '';
            if (type === 'walk') {
                // means we are at the last direction aka a walk. name needs to equal final destination
                if (j === amountOfLegs - 1) {
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
                        const snappingResponse = await axios.post(`http://${process.env.MAP_MATCHING || 'ERROR'}:8989/match`, gpx, config);
                        // need to handle errors more gracefully
                        path = snappingResponse.data.paths[0].points.coordinates.map(point => ({
                            lat: point[1],
                            long: point[0],
                        }));
                    } catch (error) {
                        // log error
                        console.log(error.data);
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
    getRoutes,
    parseRoute,
    condense,
};
