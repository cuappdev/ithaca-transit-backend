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

  init () {
    this.router.get('/stops', this.stops);
  }
}

const indexRouter = new IndexRouter();
export default indexRouter.router;
