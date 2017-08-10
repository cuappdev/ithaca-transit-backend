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
    const start = new Stop('WWWS', new Location(42.442279, -76.485267)); // CTB
    const end = new Stop('WWWE', new Location(42.455262, -76.479368)); // Clara Dickson Hall
    const startTime = 3600 * 13;

    // Assuming startTime is in seconds
    const allStops = [start, end].concat(TCAT.stops);
    RaptorUtils.walkingPaths(start, end, startTime)
      .then(walkingPaths => {
        const raptorPaths = walkingPaths
          .concat(RaptorUtils.generateRaptorPaths(startTime));

        const raptor = new Raptor(
          raptorPaths,
          allStops,
          start,
          end,
          startTime
        );

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
