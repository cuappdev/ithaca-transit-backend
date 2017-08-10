// @flow
import { Router, Request, Response, NextFunction } from 'express';
import Raptor from '../Raptor';
import RaptorUtils from '../utils/RaptorUtils';
import TCAT from '../TCAT';

class BusRoutingRouter {
  router: Router;

  constructor () {
    this.router = new Router();
    this.init();
  }

  routeMe (req: Request, res: Response, next: NextFunction): void {
    const start = TCAT.nameToStop['Schwartz Performing Arts']; // TODO Parameterize
    const stop = TCAT.nameToStop['Baker Flagpole']; // TODO Parameterize
    const startTime = 3600 * 13; // TODO Parameterize

    // Assuming startTime is in seconds
    const raptorPaths = RaptorUtils.generateRaptorPaths(startTime);

    const raptor = new Raptor(
      raptorPaths,
      TCAT.stops,
      start,
      stop,
      startTime
    );

    console.log('Start: ' + start.name);
    console.log('Stop: ' + stop.name);
    console.log('Start time: ' + startTime);

    // Respond with result
    raptor.run().then(result => {
      res.json(result);
    });
  }

  init () {
    this.router.get('/', this.routeMe);
  }
}

const busRoutingRouter = new BusRoutingRouter();
export default busRoutingRouter.router;
