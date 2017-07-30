// @flow
import { Router, Request, Response, NextFunction } from 'express';
import OSRM from 'osrm';

class IndexRouter {
  router: Router;

  constructor () {
    this.router = new Router();
    this.init();
  }

  helloWorld (req: Request, res: Response, next: NextFunction) {
    const osrm = new OSRM('map.osrm');
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

    res.json({ message: 'Hello, World' });
  }

  init () {
    this.router.get('/test', this.helloWorld);
  }
}

const indexRouter = new IndexRouter();
export default indexRouter.router;
