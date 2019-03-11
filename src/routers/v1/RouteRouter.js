// @flow
import type Request from 'express';
import AnalyticsUtils from '../../utils/AnalyticsUtils';
import ApplicationRouter from '../../appdev/ApplicationRouter';
import LogUtils from '../../utils/LogUtils';
import RouteUtils from '../../utils/RouteUtils';

class RouteRouter extends ApplicationRouter<Array<Object>> {
  constructor() {
    super(['GET', 'POST']);
  }

  getPath(): string {
    return '/route/';
  }

  // eslint-disable-next-line require-await
  async content(req: Request): Promise<Array<Object>> {
    const params = req.method === 'GET' ? req.query : req.body;
    const {
      arriveBy,
      destinationName,
      end,
      originName,
      start,
      time,
      uid,
    } = params;

    const isArriveBy = (arriveBy === '1' || arriveBy === true);
    const routes = await RouteUtils.getRoutes(destinationName, end, start, time, isArriveBy);
    if (routes.length > 0) {
      const request = {
        arriveBy,
        destinationName,
        end: routes[0].endCoords,
        originName,
        routeId: routes[0].routeId,
        start: routes[0].startCoords,
        time,
        uid,
      };
      LogUtils.log({ category: 'routeRequest', request });
    }
    AnalyticsUtils.assignRouteIdsAndCache(routes);

    return routes;
  }
}

export default new RouteRouter().router;
