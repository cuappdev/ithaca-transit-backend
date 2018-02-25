// @flow
import AbstractRouter from './AbstractRouter';
import axios from 'axios';
import qs from 'qs';

class RouteRouter extends AbstractRouter {

    constructor() {
        super('GET', '/route', true);
    }

    async content(req: Request): Promise<any> {
        let start: string = req.query.start;
        let end: string = req.query.end;
        let departureTimeQuery: string = req.query.time;
        let departureTimeMilliseconds = parseFloat(departureTimeQuery) * 1000;
        let departureTimeDate = new Date(departureTimeMilliseconds).toISOString();
        try {
            let parameters: any = {
                locale: "en-US",
                vehicle: "pt",
                weighting: "fastest",
                point: [start, end],
                points_encoded: false
            };
            parameters["pt.earliest_departure_time"] = departureTimeDate;
            let graphhopper: any = await axios.get('http://localhost:8989/route', {
                params: parameters,
                paramsSerializer: (params: any) => qs.stringify(params, {arrayFormat: 'repeat'})
            });

            //create the correct json response based on TCAT REST API doc
            let resp = graphhopper.data;
            let paths = resp.paths; //this is an array of possible routes
            let possibleRoutes = [];
            for (let index = 0; index < paths.length; index++) {

                let currPath = paths[index]; // object {}
                let totalTime = currPath.time; //total time for journey, in milliseconds
                let numberOfTransfers = currPath.transfers;
                let legs = currPath.legs; //array containing legs of journey. e.g. walk, bus ride, walk
                let amountOfLegs = legs.length;
                let departureTime = legs[0].departureTime; //string 2018-02-21T17:27:00Z
                let arriveTime = legs[amountOfLegs - 1].arrivalTime;//string 2018-02-21T17:30:53Z
                let startingLocationGeometry = legs[0].geometry;
                let endingLocationGeometry = legs[amountOfLegs - 1].geometry;

                let startingLocationLong = startingLocationGeometry.coordinates[0][0]; //name implies
                let startingLocationLat = startingLocationGeometry.coordinates[0][1];

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
                        if (j == amountOfLegs - 1) { //means we are at the last direction aka a walk. name needs to equal final destination
                            name = "your destination";
                        } else {
                            name = legs[j + 1].departureLocation
                        }
                    } else if (type == "depart") {
                        name = currLeg.departureLocation;
                    }

                    let startTime = currLeg.departureTime;
                    let endTime = currLeg.arrivalTime;

                    let currCoordinates = currLeg.geometry.coordinates //array of array of coordinates
                    let path = currCoordinates.map(point => {
                        return {
                            lat: point[1],
                            long: point[0]
                        }
                    });

                    let startLocation = path[0];
                    let endLocation = path[path.length - 1];

                    let distance = currLeg.distance;

                    let routeNumber = type == "depart" ? 99 : null;

                    let stops = [];
                    if (type == "depart") {
                        stops = currLeg.stops.map(stop => {
                            return {
                                name: stop.stop_name,
                                lat: stop.geometry.coordinates[1],
                                long: stop.geometry.coordinates[0]
                            }
                        })
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
            //res.set('Content-Type', 'application/json');
            return JSON.stringify(possibleRoutes);
        } catch (err) {
            console.log(err);
            throw err;
        }
    }

}

export default new RouteRouter().router;