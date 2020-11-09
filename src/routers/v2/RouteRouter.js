// @flow
import type Request from 'express';
import AnalyticsUtils from '../../utils/AnalyticsUtils';
import ApplicationRouter from '../../appdev/ApplicationRouter';
import LogUtils from '../../utils/LogUtils';
import RouteUtils from '../../utils/RouteUtils';

class RouteRouter extends ApplicationRouter<Object> {
  constructor() {
    super(['POST']);
  }

  getPath(): string {
    return '/route/';
  }

  async content(req: Request): Promise<Object> {
    const {
      destinationName,
      end,
      arriveBy,
      originName,
      start,
      time,
      uid,
    } = req.body;

    const isArriveBy = (arriveBy === '1' || arriveBy === true || arriveBy === 'true' || arriveBy === 'True');

    const isOriginBusStop = await RouteUtils.isBusStop(originName);
    const originBusStopName = isOriginBusStop ? originName : null;
    const sectionedRoutes = await RouteUtils.getSectionedRoutes(
      originName,
      destinationName,
      end,
      start,
      time,
      isArriveBy,
      originBusStopName,
    );
    const routes = RouteUtils.flatten(Object.values(sectionedRoutes));
    if (routes.length > 0) {
      const request = {
        isArriveBy,
        destinationName,
        end: routes[0].endCoords,
        originName,
        routeId: null,
        start: routes[0].startCoords,
        time,
        uid,
      };
      LogUtils.log({ category: 'routeRequest', request });
    }
    AnalyticsUtils.assignRouteIdsAndCache(routes);
    return sectionedRoutes;
  }
}

export default new RouteRouter().router;
