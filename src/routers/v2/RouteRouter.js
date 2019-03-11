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
      isArriveBy,
      originName,
      start,
      time,
      uid,
    } = req.body;

    const isOriginBusStop = await RouteUtils.isBusStop(originName);
    const originBusStopName = isOriginBusStop ? originName : null;
    const sectionedRoutes = await RouteUtils.getSectionedRoutes(
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
        routeId: routes[0].routeId,
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
