// @flow
import { Router, Request, Response, NextFunction } from 'express';
import tcat from '../TCAT';

class BusRoutingRouter {
  router: Router;

  constructor () {
    this.router = new Router();
    this.init();
  }

  stops (req: Request, res: Response, next: NextFunction): void {
    res.json(tcat.stops);
  }

  buses (req: Request, res: Response, next: NextFunction): void {
    res.json(tcat.buses);
  }

  distanceVectors (req: Request, res: Response, next: NextFunction): void {
    tcat.distanceMatrix.then(response => {
      res.json(response.durations);
    }).catch(err => {
      res.json(err);
    });
  }

  init () {
    this.router.get('/stops', this.stops);
    this.router.get('/buses', this.buses);
    this.router.get('/vectors', this.distanceVectors);
  }
}

const busRoutingRouter = new BusRoutingRouter();
export default busRoutingRouter.router;
