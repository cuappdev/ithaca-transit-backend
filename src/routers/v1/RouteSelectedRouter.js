// @flow
import type Request from 'express';
import ApplicationRouter from '../../appdev/ApplicationRouter';

class RouteSelectedRouter extends ApplicationRouter<Array<Object>> {
  constructor() {
    super(['POST']);
  }

  getPath(): string {
    return '/routeSelected/';
  }

  // eslint-disable-next-line require-await
  async content(req: Request): Promise<any> {
    return null;
  }
}

export default new RouteSelectedRouter().router;
