// @flow
import { Router, Request, Response, NextFunction } from 'express';

class BusRoutingRouter {
  router: Router;

  constructor () {
    this.router = new Router();
    this.init();
  }

  distanceVectors (req: Request, res: Response, next: NextFunction): void {
    res.json({});
  }

  init () {
    this.router.get('/vectors', this.distanceVectors);
  }
}

const busRoutingRouter = new BusRoutingRouter();
export default busRoutingRouter.router;
