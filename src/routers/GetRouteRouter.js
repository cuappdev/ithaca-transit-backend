// @flow
import { AppDevRouter } from 'appdev';
import { Request } from 'express';
import Kml from '../models/Kml';
import Location from '../models/Location';
import Raptor from '../Raptor';
import RaptorUtils from '../utils/RaptorUtils';
import Stop from '../models/Stop';
import TCAT from '../TCAT';
import TCATConstants from '../utils/TCATConstants';
import TCATUtils from '../utils/TCATUtils';

class GetRouteRouter extends AppDevRouter {
  constructor () {
    super('GET');
  }

  getPath (): string {
    return '/routes/';
  }

  _grabKMLsFromRoute (mainStops: Array<string>, mainStopNums: Array<number>) {
    let kmls = [];
    for (let i = 0; i < mainStopNums.length; i++) {
      const busNumber = mainStopNums[i];
      if (busNumber < 0) continue; // this is walking, no path KML to grab
      const kml: Kml = TCAT.busNumberToKml[busNumber];
      const startStop = TCAT.nameToStop[mainStops[i - 1]];
      const endStop = TCAT.nameToStop[mainStops[i]];
      kmls.push(kml.placemarkFromStartEndStops(startStop, endStop));
    }
    return kmls;
  }

  async content (req: Request) {
    const leaveBy = parseInt(req.query.leave_by);
    const startCoords = TCATUtils.coordStringToCoords(req.query.start_coords);
    const endCoords = TCATUtils.coordStringToCoords(req.query.end_coords);

    // Start / end stops
    const start = new Stop(
      TCATConstants.START_WALKING,
      new Location(startCoords.latitude, startCoords.longitude)
    );
    const end = new Stop(
      TCATConstants.END_WALKING,
      new Location(endCoords.latitude, endCoords.longitude)
    );

    // Pre-algorithm info
    const startTime = TCATUtils.unixToWeekTime(leaveBy);
    const allStops = [start, end].concat(TCAT.stops);
    const walkingPaths = await RaptorUtils.walkingPaths(start, end, startTime);
    const raptorPaths =
      walkingPaths.concat(RaptorUtils.generateRaptorPaths(startTime));

    // Execute the algorithm
    const raptor = new Raptor(
      raptorPaths,
      allStops,
      start,
      end,
      startTime
    );
    const result = await raptor.run();

    // No route was found
    if (result.length <= 1) {
      return { message: 'No route found!' };
    }

    const endTime =
      result[result.length - 1].arrivalTime -
      TCATConstants.BASE_END_TIME +
      result[result.length - 2].arrivalTime;

    // First result is when we start walking
    const departureTime = Math.floor(leaveBy);
    const arrivalTime = Math.floor(leaveBy + (endTime - startTime));

    // Then build up stop ordering / walking information
    let mainStops = [];
    let mainStopNums = [];
    for (let i = 0; i < result.length; i++) {
      const r = result[i];
      if (r.endStop.name === TCATConstants.END_WALKING) {
        mainStopNums.push(TCATConstants.WALKING_TCAT_NUMBER);
      } else if (r.endStop.name !== TCATConstants.START_WALKING) {
        mainStopNums.push(r.busNum);
        mainStops.push(r.endStop.name);
      }
    }

    const kmls = this._grabKMLsFromRoute(mainStops, mainStopNums);

    // Construct a routeSummary array of JSON objects with specific details for
    // each stop in the route
    const routeSummary = [];
    const currLocation = {};
    currLocation.name = TCATConstants.LOCATION_NAME_CURR;
    currLocation.busNumber = mainStopNums[0];
    currLocation.nextDirection = TCATConstants.NEXT_DIRECTION_WALK;
    currLocation.type = TCATConstants.LOCATION_TYPE_CURR;
    routeSummary.push(currLocation);
    for (let i = 1; i <= result.length; i++) {
      const currNode = {};
      // the following if block is if the final destination is a bus stop and
      // an end location needs to be added to the array of json objects
      if ((result.length === mainStopNums.length) && (i === result.length)) {
        currNode.name = TCATConstants.LOCATION_NAME_END;
        currNode.nextDirection = TCATConstants.NEXT_DIRECTION_NONE;
        currNode.type = TCATConstants.LOCATION_TYPE_PLACE;
        routeSummary.push(currNode);
        break;
      }
      const currResult = result[i];
      currNode.name = mainStops[i-1];
      currNode.busNumber = mainStopNums[i];
      if (currNode.busNumber === -1) {

        currNode.nextDirection = TCATConstants.NEXT_DIRECTION_WALK;
      } else {
        currNode.nextDirection = TCATConstants.NEXT_DIRECTION_BUS;
      }
      if (result.length === mainStops.length){
        currNode.type = TCATConstants.LOCATION_TYPE_PLACE;
      } else {
        currNode.type = TCATConstants.LOCATION_TYPE_STOP;
      }
      routeSummary.push(currNode);
    }
    const directions = [];
    const currLocationDir = {};
    currLocationDir.type = "walk";
    currLocationDir.locationName = mainStops[0];
    currLocationDir.startLocation = result[0].startStop.location;
    currLocationDir.endLocation = result[0].endStop.location;
    currLocationDir.startTime = departureTime;
    currLocationDir.endTime = departureTime + (result[0].arrivalTime - departureTime)
    currLocationDir.busStops=[];
    currLocationDir.routeNumber = -1;
    directions.push(currLocationDir);
    const nonWalkingRouteNums = [];
    for (let i = 0; i < mainStopNums.length; i++) {
      if (mainStopNums[i] != -1) {
        nonWalkingRouteNums.push(mainStopNums[i]);
      }
    }
    for (let j = 0; j < nonWalkingRouteNums.length; j++) {
      const departDir = {};
      const arriveDir = {};
      departDir.type = "depart";
      departDir.locationName = mainStops[j];
      departDir.startLocation = result[j+1].startStop.location;
      departDir.endLocation = result[j+1].endStop.location;
      departDir.startTime = result[j].arrivalTime;
      departDir.endTime = result[j+1].arrivalTime;
      departDir.busStops = ["Bus Stop #1", "Bus Stop #2", "Bus Stop #3"];
      departDir.routeNumber = nonWalkingRouteNums[j];
      arriveDir.type = "arrive";
      arriveDir.locationName = mainStops[j+1];
      arriveDir.startLocation = result[j+2].startStop.location;
      arriveDir.endLocation = result[j+2].endStop.location;
      arriveDir.startTime = result[j+2].arrivalTime;
      arriveDir.endTime = result[j+2].arrivalTime;
      arriveDir.busStops = [];
      arriveDir.routeNumber = -1;
      directions.push(departDir);
      directions.push(arriveDir);
    }
    const endDir = {}
    endDir.type = "walk";
    endDir.locationName = mainStops[mainStops.length-1];
    endDir.startLocation = result[result.length-1].startStop.location;
    endDir.endLocation = result[result.length-1].endStop.location;
    endDir.startTime = result[result.length-2].arrivalTime;
    endDir.endTime = arrivalTime;
    endDir.busStops = [];
    endDir.routeNumber = -1;
    directions.push(endDir);

    // type is of 3 types, walk, depart, or arrivalTime
    // location name: for first point, will be current location/first bus stop and then for
    //  ending it will be the end location that the user has requested
    // startLocation + endLocation: start point of the location and the end point of location
    //  arrive startLocation: location the bus will arrive at
    //  depart endLocation: location where user should debark
    // startTime+endTime: start and end time the direction should take
    // busStops: empty or list of bus stops in the routeSummary
    // routeNumber: route number

    // "directions": [
    //
    // 			{
    // 				"type": "walk",
    // 				"locationName": "Bus Stop #1",
    // 				"startLocation": {
    // 					"latitude": 40,
    // 					"longitude": 70
    // 				},
    // 				"endLocation": {
    // 					"latitude": 40,
    // 					"longitude": 70
    // 				},
    // 				"startTime": 1505337262,
    // 				"endTime": 1505337462,
    // 				"busStops": [],
    // 				"routeNumber": 0
    // 			},
    //
    // 			{
    // 				"type": "depart",
    // 				"locationName": "Bus Stop #1",
    // 				"startLocation": {
    // 					"latitude": 40,
    // 					"longitude": 70
    // 				},
    // 				"endLocation": {
    // 					"latitude": 41,
    // 					"longitude": 71
    // 				},
    // 				"startTime": 1505337462,
    // 				"endTime": 1505337762,
    // 				"busStops": ["Sage Hall", "Rockefeller Hall", "Baker Flagpole"],
    // 				"routeNumber": 90
    // 			},
    //
    // 			{
    // 				"type": "arrive",
    // 				"locationName": "Bus Stop #2",
    // 				"startLocation": {
    // 					"latitude": 41,
    // 					"longitude": 71
    // 				},
    // 				"endLocation": {
    // 					"latitude": 41,
    // 					"longitude": 71
    // 				},
    // 				"startTime": 1505337762,
    // 				"endTime": 1505337762,
    // 				"busStops": [],
    // 				"routeNumber": 0
    // 			},
    //
    // 			{
    // 				"type": "walk",
    // 				"locationName": "Keeton House",
    // 				"startLocation": {
    // 					"latitude": 41,
    // 					"longitude": 71
    // 				},
    // 				"endLocation": {
    // 					"latitude": 42,
    // 					"longitude": 72
    // 				},
    // 				"startTime": 1505337762,
    // 				"endTime": 1505337962,
    // 				"busStops": [],
    // 				"routeNumber": 0
    // 			}
    //
    // 		]

    return [{
      // Given to use originally
      startCoords: startCoords,
      endCoords: endCoords,
      // Main data
      departureTime: departureTime,
      arrivalTime: arrivalTime,
      routeSummary: routeSummary,
      directions: directions,
      kmls: kmls
    }];
  }
}

export default new GetRouteRouter().router;
