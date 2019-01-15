// @flow
import type Request from 'express';
import ApplicationRouter from '../appdev/ApplicationRouter';
import RouteUtilsV2 from '../utils/RouteUtilsV2';
import LogUtils from '../utils/LogUtils';
import AnalyticsUtils from '../utils/AnalyticsUtils';

class RouteRouterV2 extends ApplicationRouter<Array<Object>> {
    constructor() {
        super('GET');
    }

    getPath(): string {
        return '/route/';
    }

    // eslint-disable-next-line require-await
    async content(req: Request): Promise<Array<Object>> {
        const {
            arriveBy,
            destinationName,
            end,
            start,
            time: departureTimeQuery,
        } = req.query;

        const routeRes = await RouteUtilsV2.getRoute(destinationName, end, start, departureTimeQuery, arriveBy);

        const request = {
            destinationName,
            start: routeRes[0].startCoords,
            end: routeRes[0].endCoords,
            time: departureTimeQuery,
            arriveBy,
            routeId: routeRes[0].routeId,
        };
        LogUtils.log({ category: 'routeRequestV2', request });
        AnalyticsUtils.assignRouteIdsAndCache(routeRes);

        return routeRes;
    }
}

export default new RouteRouterV2().router;
