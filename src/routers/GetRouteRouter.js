// @flow
import { AppDevRouter } from 'appdev';
import { Request } from 'express';
import Location from '../models/Location';
import Raptor from '../Raptor';
import RaptorUtils from '../utils/RaptorUtils';
import Stop from '../models/Stop';
import TCAT from '../TCAT';
import TCATUtils from '../utils/TCATUtils';

class GetRouteRouter extends AppDevRouter {
  constructor () {
    super('GET');
  }

  getPath (): string {
    return '/routes/';
  }

  async content (req: Request) {
    const leaveBy = req.query.leave_by;

    // TODO Parameterize
    // CTB
    const start = new Stop('WWWS', new Location(42.442279, -76.485267));
    // Clara Dickson Hall
    const end = new Stop('WWWE', new Location(42.455262, -76.479368));
    const startTime = TCATUtils.unixToWeekTime(leaveBy);

    // Assuming startTime is in seconds
    const allStops = [start, end].concat(TCAT.stops);
    const walkingPaths = await RaptorUtils.walkingPaths(start, end, startTime);

    const raptorPaths =
      walkingPaths.concat(RaptorUtils.generateRaptorPaths(startTime));

    const raptor = new Raptor(
      raptorPaths,
      allStops,
      TCAT.busNumberToKml,
      start,
      end,
      startTime
    );

    const result = await raptor.run();
    return result;
  }
}

export default new GetRouteRouter().router;
