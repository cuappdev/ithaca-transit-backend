// @flow
import { AppDevRouter } from 'appdev';
import { Request } from 'express';
import TCAT from '../TCAT';

class GetAllStopsRouter extends AppDevRouter {
  constructor () {
    super('GET');
  }

  getPath (): string {
    return '/stops/';
  }

  async content (req: Request) {
    return TCAT.stops;
  }
}

export default new GetAllStopsRouter().router;
