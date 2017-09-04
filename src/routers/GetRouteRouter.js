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
    const stopSummary = [];
    for (let i = 0; i <result.length; i++) {
      const r = result[i];
      const obj = {};
      if (i == 0 && r.startStop.name == START_WALKING) {
        obj.name = "Current Location";
        obj.type = "currentLocation";
        obj.busNumber = r.busNum;
      } else {
        obj.name = r.startStop.name;
        obj.busNumber = r.busNum;
      }
      if ((result[i+1].busNum == -1) && (i < result.length)) {
          obj.nextDirection = "walk";
      } else if ((result[i+1].busNum == null) && (i < result.length)) {
          obj.nextDirection = "none";
      } else {
        obj.nextDirection = "bus";
      }
      if (obj.nextDirection == "bus" || obj.nextDirection == "walk") {
        obj.type = "stop";
      }
      if ((i == result.length - 1) && (r.endStop.name == END_WALKING)) {
        obj.type = "place";
      }
      stopSummary.append(obj);
    }

    const kmls = this._grabKMLsFromRoute(mainStops, mainStopNums);

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

export default new GetRouteRouter().router;
