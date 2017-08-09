// @flow
import { Router, Request, Response, NextFunction } from 'express';
import TCAT from '../TCAT';

class IndexRouter {
  router: Router;

  constructor () {
    this.router = new Router();
    this.init();
  }

  stops (req: Request, res: Response, next: NextFunction): void {
    res.json(TCAT.stops);
  }

  buses (req: Request, res: Response, next: NextFunction): void {
    res.json(TCAT.buses);
  }

  init () {
    this.router.get('/stops', this.stops);
    this.router.get('/buses', this.buses);
  }
}

const indexRouter = new IndexRouter();
export default indexRouter.router;
