// @flow
import { AppDevRouter } from 'appdev';
import { Request } from 'express';
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
      TCAT.busNumberToKml,
      start,
      end,
      startTime
    );
    const result = await raptor.run();

    const endTime =
      result[result.length - 1].arrivalTime -
      TCATConstants.BASE_END_TIME +
      result[result.length - 2].arrivalTime;

    // First result is when we start walking
    const departureTime = Math.floor(leaveBy);
    const arrivalTime = Math.floor(leaveBy + (endTime - startTime));

    return {
      departureTime: departureTime,
      arrivalTime: arrivalTime,
      result: result
    };
  }
}

export default new GetRouteRouter().router;
