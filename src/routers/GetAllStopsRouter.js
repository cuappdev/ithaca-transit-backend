// @flow
import { AppDevRouter } from 'appdev';
import { Request } from 'express';
import GTFS from '../GTFS';

class GetAllStopsRouter extends AppDevRouter {
  constructor () {
    super('GET');
  }

  getPath (): string {
    return '/stops/';
  }

  async content (req: Request) {
    return GTFS.stops;
  }
}

export default new GetAllStopsRouter().router;
