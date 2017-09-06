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

    // Construct a stopSummary array of JSON objects with specific details for
    // each stop in the route
    const stopSummary = [];
    for (let i = 0; i < result.length; i++) {
      const currResult = result[i];
      const currNode = {};
      if (i === 0) {
        currNode.name = TCATConstants.LOCATION_NAME_CURR;
        currNode.nextDirection = TCATConstants.NEXT_DIRECTION_WALK;
        currNode.type = TCATConstants.LOCATION_TYPE_CURR;
      } else {
        currNode.name = mainStops[i-1];
      }
      currNode.busNumber = mainStopNums[i];
      if (currNode.busNumber === -1) {
        currNode.nextDirection = TCATConstants.NEXT_DIRECTION_WALK;
      } else {
        currNode.nextDirection = TCATConstants.NEXT_DIRECTION_BUS;
      }
      if (i === result.length - 1) {
        currNode.type = TCATConstants.LOCATION_TYPE_PLACE;
      } else if (!currNode.type) {
        currNode.type = TCATConstants.LOCATION_TYPE_STOP;
      }
      stopSummary.push(currNode);
    }

    return [{
      // Given to use originally
      startCoords: startCoords,
      endCoords: endCoords,
      // Main data
      departureTime: departureTime,
      arrivalTime: arrivalTime,
      stopSummary: stopSummary,
      kmls: kmls
    }];
  }
}

export default new GetRouteRouter().router;
