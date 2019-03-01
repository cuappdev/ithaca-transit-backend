// @flow
import type Request from 'express';
import AnalyticsUtils from '../utils/AnalyticsUtils';
import ApplicationRouter from '../appdev/ApplicationRouter';
import LogUtils from '../utils/LogUtils';
import SectionRouteUtils from '../utils/SectionRouteUtils';

class SectionRouteRouter extends ApplicationRouter<Array<Object>> {
  constructor() {
    super(['POST']);
  }

  getPath(): string {
    return '/route/';
  }

  async content(req: Request): Promise<Object> {
    const {
      isArriveBy,
      destinationName,
      end,
      originName,
      start,
      time,
      uid,
    } = req.body;

    const isOriginBusStop = await SectionRouteUtils.isBusStop(originName);
    const originBusStopName = isOriginBusStop ? originName : null;
    const sectionedRoutes = await SectionRouteUtils.getSectionedRoutes(
      destinationName,
      end,
      start,
      time,
      isArriveBy,
      originBusStopName,
    );
    const routes = SectionRouteUtils.flatten(Object.values(sectionedRoutes));
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

export default new SectionRouteRouter().router;
