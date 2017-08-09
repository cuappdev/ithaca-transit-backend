// @flow
import { Router, Request, Response, NextFunction } from 'express';
import Raptor from '../Raptor';
import TCAT from '../TCAT';

class BusRoutingRouter {
  router: Router;

  constructor () {
    this.router = new Router();
    this.init();
  }

  routeMe (req: Request, res: Response, next: NextFunction): void {
    const raptor = new Raptor(
      TCAT.buses,
      TCAT.stops,
      TCAT.stops[0], // TODO Parameterize
      TCAT.stops[5], // TODO Parameterize
      3600 * 13, // TODO Parameterize
      4 // TODO Parameterize
    );

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
