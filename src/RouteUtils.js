//@flow
import TCATUtils from './TCATUtils';
import axios from 'axios';
import qs from 'qs';
import csv from 'csvtojson';
import fs from 'fs';
import createGpx from 'gps-to-gpx';

/**
 * distanceBetweenPoints(point1, point2) returns the distance between two points in miles
 */
function distanceBetweenPoints(point1: Object, point2: Object): number {
    var radlat1 = Math.PI * point1.lat / 180
    var radlat2 = Math.PI * point2.lat / 180
    var theta = point1.long - point2.long
    var radtheta = Math.PI * theta / 180
    var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    dist = Math.acos(dist)
    dist = dist * 180 / Math.PI
    dist = dist * 60 * 1.1515
    return dist
}

function createGpxJson(stops: Array<Object>, startTime: String): Object {
    var waypoints = stops.map(stop => {
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

async function parseRoute(resp: Object) {
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
        let legs = currPath.legs
        let amountOfLegs = legs.length;

        //string 2018-02-21T17:27:00Z
        let departureTime = legs[0].departureTime;
        let arriveTime = legs[amountOfLegs - 1].arrivalTime;

        let startingLocationGeometry = legs[0].geometry;
        let endingLocationGeometry = legs[amountOfLegs - 1].geometry;

        let startingLocationLong = startingLocationGeometry.coordinates[0][0]
        let startingLocationLat = startingLocationGeometry.coordinates[0][1]

        let endingLocationLong = endingLocationGeometry.coordinates[endingLocationGeometry.coordinates.length - 1][0]
        let endingLocationLat = endingLocationGeometry.coordinates[endingLocationGeometry.coordinates.length - 1][1]

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

        let directions = [];
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
                    name = "your destination";
                } else {
                    name = legs[j + 1].departureLocation
                }
            } else if (type == "depart") {
                name = currLeg.departureLocation;
            }

            let startTime = currLeg.departureTime;
            let endTime = currLeg.arrivalTime;

            let currCoordinates = currLeg.geometry.coordinates
            let path = currCoordinates.map(point => {
                return {
                    lat: point[1],
                    long: point[0]
                }
            });
            let startLocation = path[0];
            let endLocation = path[path.length - 1];
            var routeNumber = null;
            let stops = [];
            let distance = currLeg.distance;
            if (type == "depart") {

                var route = TCATUtils.routeJson.filter(routeObj => {
                    return routeObj["route_id"] == currLeg["route_id"];
                });

                path = currLeg.stops.map(stop => {
                    return {
                        lat: stop.geometry.coordinates[1],
                        long: stop.geometry.coordinates[0]
                    }
                })

                if (route.length == 1) {

                    //this gets the correct route number for the gtfs data
                    routeNumber = parseInt(route[0]["route_short_name"]);
                }
                //if the path.length <= 3, map matching will return error
                if (path.length > 3) {

                    //Map Matching
                    let firstStopCoords = path[0];
                    let lastStopCoords = path[path.length - 1];
                    var gpxJson = createGpxJson(path, startTime);
                    const gpx = createGpx(gpxJson.waypoints, {
                        activityName: gpxJson.activityType,
                        startTime: gpxJson.startTime
                    });

                    var config = {
                        headers: {
                            'Content-Type': 'application/xml'
                        },
                        params: {
                            'points_encoded': false,
                            'vehicle': 'car'
                        }
                    };

                    var snappingResponse = await axios.post('http://localhost:8989/match', gpx, config);
                    path = snappingResponse.data.paths[0].points.coordinates.map(point => {
                        return {
                            lat: point[1],
                            long: point[0]
                        }
                    });

                    //Trim Coordinates so they start/end at bus stops
                    var startDistanceArray = path.map(point2 => {
                        return distanceBetweenPoints(firstStopCoords, point2);
                    });

                    var endDistanceArray = path.map(point2 => {
                        return distanceBetweenPoints(lastStopCoords, point2);
                    });

                    var startIndex = startDistanceArray.indexOf(Math.min(...startDistanceArray));
                    var endIndex = endDistanceArray.indexOf(Math.min(...endDistanceArray));

                    path = path.slice(startIndex, endIndex);
                    path.unshift(firstStopCoords);
                    path.push(lastStopCoords);
                }

                //create all stops array
                stops = currLeg.stops.map(stop => {
                    return {
                        name: stop.stop_name,
                        lat: stop.geometry.coordinates[1],
                        long: stop.geometry.coordinates[0]
                    }
                });
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
                stops: stops
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
    parseRoute: parseRoute
};