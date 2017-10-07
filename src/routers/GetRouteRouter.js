// @flow
import { AppDevRouter } from 'appdev';
import { Request } from 'express';
import Kml from '../models/Kml';
import Location from '../models/Location';
import Stop from '../models/Stop';
import TCAT from '../TCAT';
import TCATConstants from '../utils/TCATConstants';
import TCATUtils from '../utils/TCATUtils';
import TimeUtils from '../utils/TimeUtils';
import GTFS from '../GTFS';
import BasedRaptorUtils from '../utils/BasedRaptorUtils';
import BasedRaptor from '../BasedRaptor';

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
      const startStop = GTFS.nameToStopIndex[mainStops[i - 1]];
      const endStop = GTFS.nameToStopIndex[mainStops[i]];
      kmls.push(kml.placemarkFromStartEndStops(startStop, endStop));
    }
    return kmls;
  }

  // test URL: http://localhost:3000/api/v1/routes?leave_by=1504474540&start_coords=42.4424,-76.4849&end_coords=42.483327,-76.490933
  async content (req: Request) {
    const leaveBy = parseInt(req.query.leave_by);
    const dayStartTime = TimeUtils.unixTimeToDayTime(leaveBy);
    const serviceDate = TimeUtils.unixTimeToGTFSDate(leaveBy);
    const {buses, stopsToRoutes} = await GTFS.buses(serviceDate);

    // Start coordinate
    const startCoords = TCATUtils.coordStringToCoords(req.query.start_coords);
    const start = new Stop(
      TCATConstants.START_WALKING,
      new Location(startCoords.latitude, startCoords.longitude)
    );

    // End coordinate
    const endCoords = TCATUtils.coordStringToCoords(req.query.end_coords);
    const end = new Stop(
      TCATConstants.END_WALKING,
      new Location(endCoords.latitude, endCoords.longitude)
    );

    // Start / end stops
    const footpathMatrix = await BasedRaptorUtils.footpathMatrix(start, end);

    // Create Raptor instance
    const basedRaptor = new BasedRaptor(
      buses,
      start,
      end,
      stopsToRoutes,
      footpathMatrix,
      dayStartTime,
      GTFS.stops
    );

    // Run Raptor
    return {
      results: basedRaptor.run(),
      baseTime: parseInt(req.query.leave_by) - dayStartTime
    };
  }
}

export default new GetRouteRouter().router;
