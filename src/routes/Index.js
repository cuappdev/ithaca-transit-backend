// @flow
import { Router, Request, Response, NextFunction } from 'express';
import osrm from '../OSRM';
import tcat from '../TCAT';

class IndexRouter {
  router: Router;

  constructor () {
    this.router = new Router();
    this.init();
  }

  helloWorld (req: Request, res: Response, next: NextFunction) {
    const options = {
      coordinates: [
        [-76.499723, 42.44965],
        [-76.49965, 42.452017]
      ]
    };

    osrm.table(options, (err, response) => {
      if (err) {
        console.log('An error occurred');
      }
      console.log(response.durations);
      console.log(response.sources);
      console.log(response.destinations);
    });

    res.json(tcat.stops);
  }

  init () {
    this.router.get('/test', this.helloWorld);
  }
}

const indexRouter = new IndexRouter();
export default indexRouter.router;
