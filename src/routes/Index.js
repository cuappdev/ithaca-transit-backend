// @flow
import { Router, Request, Response, NextFunction } from 'express';

class IndexRouter {
  router: Router;

  constructor () {
    this.router = new Router();
    this.init();
  }

  helloWorld (req: Request, res: Response, next: NextFunction): void {
    res.json({ message: 'Hello, World!' });
  }

  init () {
    this.router.get('/hello', this.helloWorld);
  }
}

const indexRouter = new IndexRouter();
export default indexRouter.router;
