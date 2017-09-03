// @flow
import { AppDevRouter } from 'appdev';
import { Request } from 'express';
import Kml from '../models/Kml';
import Location from '../models/Location';
import Stop from '../models/Stop';
import TCAT from '../TCAT';
import TCATConstants from '../utils/TCATConstants';
import TCATUtils from '../utils/TCATUtils';
import GTFS from '../GTFS'

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
    const buses = GTFS.buses([15]);
  /*  const leaveBy = parseInt(req.query.leave_by);
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
*/
    // Pre-algorithm info
/*    const startTime = TCATUtils.unixToWeekTime(leaveBy);
    const allStops = [start, end].concat(TCAT.stops);
    const walkingPaths = await RaptorUtils.walkingPaths(start, end, startTime);
    const raptorPaths =
      walkingPaths.concat(RaptorUtils.generateRaptorPaths(startTime));
*/
    return buses;
  }
}

export default new GetRouteRouter().router;
