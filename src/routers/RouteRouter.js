// @flow
import type Request from 'express';
import ApplicationRouter from '../appdev/ApplicationRouter';
import AnalyticsUtils from '../utils/AnalyticsUtils';
import LogUtils from '../utils/LogUtils';
import RouteUtils from '../utils/RouteUtils';

class RouteRouter extends ApplicationRouter<Array<Object>> {
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
            originName,
            start,
            time: departureTimeQuery,
            uid,
        } = req.query;

        const routeRes = await RouteUtils.getRoute(destinationName, end, start, departureTimeQuery, arriveBy);
        const request = {
            arriveBy,
            destinationName,
            end: routeRes[0].endCoords,
            originName,
            routeId: routeRes[0].routeId,
            start: routeRes[0].startCoords,
            time: departureTimeQuery,
            uid,
        };
        LogUtils.log({ category: 'routeRequest', request });
        AnalyticsUtils.assignRouteIdsAndCache(routeRes);

        return routeRes;
    }
}

export default new RouteRouter().router;
