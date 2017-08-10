// @flow
import { Router, Request, Response, NextFunction } from 'express';
import Location from '../models/Location';
import Raptor from '../Raptor';
import RaptorUtils from '../utils/RaptorUtils';
import Stop from '../models/Stop';
import TCAT from '../TCAT';

class BusRoutingRouter {
  router: Router;

  constructor () {
    this.router = new Router();
    this.init();
  }

  routeMe (req: Request, res: Response, next: NextFunction): void {
    // TODO Parameterize
    const start = new Stop('Walking Start', new Location(42.440613, -76.485177));
    const end = new Stop('Walking End', new Location(42.448477, -76.479729));
    const startTime = 3600 * 13;

    // Assuming startTime is in seconds
    const allStops = TCAT.stops.concat([start, end]);
    RaptorUtils.walkingPaths(start, end, startTime)
      .then(walkingPaths => {
        const raptorPaths =
          RaptorUtils.generateRaptorPaths(startTime).concat(walkingPaths);

        const raptor = new Raptor(
          raptorPaths,
          allStops,
          start,
          end,
          startTime
        );

        console.log('Start: ' + start.name);
        console.log('Stop: ' + end.name);
        console.log('Start time: ' + startTime);
        return raptor.run();
      })
      .then(result => {
        res.json(result);
      });
  }

  init () {
    this.router.get('/', this.routeMe);
  }
}

const busRoutingRouter = new BusRoutingRouter();
export default busRoutingRouter.router;
