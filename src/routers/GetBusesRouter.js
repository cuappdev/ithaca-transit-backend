// @flow
import { AppDevRouter } from 'appdev';
import { Request } from 'express';
import TCAT from '../TCAT';

class GetBusesRouter extends AppDevRouter {
  constructor () {
    super('GET');
  }

  getPath (): string {
    return '/buses/';
  }

  async content (req: Request) {
    return TCAT.buses;
  }
}

export default new GetBusesRouter().router;
