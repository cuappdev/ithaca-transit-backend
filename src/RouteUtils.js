//@flow
import TCATUtils from './TCATUtils';
import RealtimeFeedUtils from './RealtimeFeedUtils';
import AllStopUtils from './AllStopUtils'
import axios from 'axios';
import createGpx from 'gps-to-gpx';

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
    return dist
}

function createGpxJson(stops: Array<Object>, startTime: String): Object {
    const waypoints = stops.map(stop => {
        return {
            latitude: stop.lat,
            longitude: stop.long,
            elevation: 0,
            time: startTime
        }
    });
    return {
        activityType: "GraphHopper Track",
        startTime: startTime,
        waypoints: waypoints
    }
}

function mergeDirections(first, second) {
    second.stops.shift();

    second.path.shift()
    let path = first.path.concat(second.path);
    let distance = first.distance + second.distance;
    let stops = first.stops.concat(second.stops);
    let tripIDs = first.tripIdentifiers.concat(second.tripIdentifiers);
    return {
        type: first.type,
        name: first.name,
        startTime: first.startTime,
        endTime: second.endTime,
        startLocation: first.startLocation,
        endLocation: second.endLocation,
        path: path,
        distance: distance,
        routeNumber: first.routeNumber,
        stops: stops,
        tripIdentifiers: tripIDs
    }
}

function condense(route: Object, startCoords: string, endCoords: string) {
    const updatedDirections = [];

    let canFirstDirectionBeRemoved = AllStopUtils.isStop(startCoords, route.directions[0].name);
    let canLastDirectionBeRemoved = AllStopUtils.isStop(endCoords,
        route.directions[route.directions.length-1].name);
    if(canFirstDirectionBeRemoved) {
        route.directions.shift();
    }
    if(canLastDirectionBeRemoved){
        route.directions.pop();
    }

    for (let index = 0; index < route.directions.length; index++) {
        let direction = route.directions[index];
        if (index != 0) {
            let firstDirection = route.directions[index - 1];
            let secondDirection = route.directions[index];
            if (direction.type == "depart" && route.directions[index - 1].type == "depart") {
                //if we are here, we have a possible merge
                if (firstDirection.routeNumber == secondDirection.routeNumber) {
                    //this means both directions have the same routeNumber.
                    // No real transfer, probably just change in trip_ids
                    let combinedDirection = mergeDirections(firstDirection, secondDirection);
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
    return route
}

async function parseRoute(resp: Object, destinationName: string) {

    //array of parsed routes
    let possibleRoutes = [];

    let paths = resp.paths;
    
    for (let index = 0; index < paths.length; index++) {

        let currPath = paths[index];

         //total time for journey, in milliseconds
        let totalTime = currPath.time;

        //this won't increment if the passenger 'stays on bus'
        let numberOfTransfers = currPath.transfers;

        //array containing legs of journey. e.g. walk, bus ride, walk
        let legs = currPath.legs;
        let amountOfLegs = legs.length;

        //string 2018-02-21T17:27:00Z
        let departureTime = legs[0].departureTime;
        let arriveTime = legs[amountOfLegs - 1].arrivalTime;

        let startingLocationGeometry = legs[0].geometry;
        let endingLocationGeometry = legs[amountOfLegs - 1].geometry;

        let startingLocationLong = startingLocationGeometry.coordinates[0][0];
        let startingLocationLat = startingLocationGeometry.coordinates[0][1];

        let endingLocationLong = endingLocationGeometry.coordinates[endingLocationGeometry.coordinates.length - 1][0];
        let endingLocationLat = endingLocationGeometry.coordinates[endingLocationGeometry.coordinates.length - 1][1];

        let startCoords = {
            lat: startingLocationLat,
            long: startingLocationLong
        };

        let endCoords = {
            lat: endingLocationLat,
            long: endingLocationLong
        };

        let boundingBox = {
            minLat: currPath.bbox[1],
            minLong: currPath.bbox[0],
            maxLat: currPath.bbox[3],
            maxLong: currPath.bbox[2]
        };

        let directions: Array<Object> = [];
        for (let j = 0; j < amountOfLegs; j++) {
            let currLeg = legs[j];
            let type = currLeg.type;
            if (type == "pt") {
                type = "depart";
            }

            let name = "";
            if (type == "walk") {

                //means we are at the last direction aka a walk. name needs to equal final destination
                if (j == amountOfLegs - 1) {
                    name = destinationName;
                } else {
                    name = legs[j + 1].departureLocation
                }
            } else if (type == "depart") {
                name = currLeg.departureLocation;
            }

            let startTime = currLeg.departureTime;
            let endTime = currLeg.arrivalTime;

            let currCoordinates = currLeg.geometry.coordinates;
            let path = currCoordinates.map(point => {
                return {
                    lat: point[1],
                    long: point[0]
                }
            });
            let startLocation = path[0];
            let endLocation = path[path.length - 1];
            let routeNumber = null;
            let tripID = null;
            let delay = null;
            let stops = [];
            let stayOnBusForTransfer = false;
            
            let distance = currLeg.distance;
            if (type == "depart") {
                if (currLeg.isInSameVehicleAsPrevious) {
                    //last depart was a transfer
                    stayOnBusForTransfer = true;
                }

                tripID = [currLeg["trip_id"]];
                const route = TCATUtils.routeJson.filter(routeObj => {
                    return routeObj["route_id"] == currLeg["route_id"];
                });

                path = currLeg.stops.map(stop => {
                    return {
                        lat: stop.geometry.coordinates[1],
                        long: stop.geometry.coordinates[0]
                    }
                });

                if (route.length == 1) {
                    //this gets the correct route number for the gtfs data
                    routeNumber = parseInt(route[0]["route_short_name"]);
                }
                
                //ensure path.length >= 3 for map matching
                if (path.length < 3) {
                	let firstStopCoords = path[0];
                	let lastStopCoords = path[path.length - 1];
					let averageStopCoords = {
						lat: (firstStopCoords.lat + lastStopCoords.lat)/2.0,
						long: (firstStopCoords.long + lastStopCoords.long)/2.0,						
					};
                    path.splice(1, 0, averageStopCoords);
                }
                
                //if the path.length < 3, map matching will return error
                if (path.length >= 3) {

                    //Map Matching
                    let firstStopCoords = path[0];
                    let lastStopCoords = path[path.length - 1];
                    const gpxJson = createGpxJson(path, startTime);
                    const gpx = createGpx(gpxJson.waypoints, {
                        activityName: gpxJson.activityType,
                        startTime: gpxJson.startTime
                    });

                    const config = {
                        headers: {
                            'Content-Type': 'application/xml'
                        },
                        params: {
                            'points_encoded': false,
                            'vehicle': 'car'
                        }
                    };

                    const snappingResponse = await axios.post('http://localhost:8989/match', gpx, config);
                    path = snappingResponse.data.paths[0].points.coordinates.map(point => {
                        return {
                            lat: point[1],
                            long: point[0]
                        }
                    });

                    //Trim Coordinates so they start/end at bus stops
                    const startDistanceArray = path.map(point2 => {
                        return distanceBetweenPoints(firstStopCoords, point2);
                    });

                    const endDistanceArray = path.map(point2 => {
                        return distanceBetweenPoints(lastStopCoords, point2);
                    });

                    const startIndex = startDistanceArray.indexOf(Math.min(...startDistanceArray));
                    const endIndex = endDistanceArray.indexOf(Math.min(...endDistanceArray));

                    path = path.slice(startIndex, endIndex);
                    path.unshift(firstStopCoords);
                    path.push(lastStopCoords);
                }

                //create all stops array
                stops = currLeg.stops.map(stop => {
                    return {
                        name: stop.stop_name,
                        lat: stop.geometry.coordinates[1],
                        long: stop.geometry.coordinates[0],
                        stopID: stop.stop_id
                    }
                });

                delay = RealtimeFeedUtils.getDelay(stops[0].stopID, tripID[0]);
            }

            directions.push({
                type: type,
                name: name,
                startTime: startTime,
                endTime: endTime,
                startLocation: startLocation,
                endLocation: endLocation,
                path: path,
                distance: distance,
                routeNumber: routeNumber,
                stops: stops,
                tripIdentifiers: tripID,
                delay: delay,
                stayOnBusForTransfer: stayOnBusForTransfer
            })
        }

        possibleRoutes.push({
            departureTime: departureTime,
            arrivalTime: arriveTime,
            directions: directions,
            startCoords: startCoords,
            endCoords: endCoords,
            boundingBox: boundingBox,
            numberOfTransfers: numberOfTransfers
        })
    }
    return possibleRoutes;
}

export default {
    parseRoute: parseRoute,
    condense: condense
};