// @flow
import type Request from 'express';
import AnalyticsUtils from '../../utils/AnalyticsUtils';
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
    if (req.body.routeId) {
      return AnalyticsUtils.selectRoute(req.body.routeId, req.body.uid);
    }
    return null;
  }
}

export default new RouteSelectedRouter().router;
