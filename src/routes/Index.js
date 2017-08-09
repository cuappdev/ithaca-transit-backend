// @flow
import { Router, Request, Response, NextFunction } from 'express';
import TCAT from '../TCAT';

class IndexRouter {
  router: Router;

  constructor () {
    this.router = new Router();
    this.init();
  }

  helloWorld (req: Request, res: Response, next: NextFunction): void {
    res.json({ message: 'Hello, World!' });
  }

  stops (req: Request, res: Response, next: NextFunction): void {
    res.json(TCAT.stops);
  }

  init () {
    this.router.get('/hello', this.helloWorld);
    this.router.get('/stops', this.stops);
  }
}

const indexRouter = new IndexRouter();
export default indexRouter.router;
