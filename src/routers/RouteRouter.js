// @flow
import type Request from 'express';
import ApplicationRouter from '../appdev/ApplicationRouter';
import AnalyticsUtils from '../utils/AnalyticsUtils';
import LogUtils from '../utils/LogUtils';
import RouteUtils from '../utils/RouteUtils';

class RouteRouter extends ApplicationRouter<Array<Object>> {
    constructor() {
        super(['GET']);
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

        const arriveByBool = arriveBy === '1';
        const routes = await RouteUtils.getRoutes(destinationName, end, start, departureTimeQuery, arriveByBool);
        const request = {
            arriveBy,
            destinationName,
            end: routes[0].endCoords,
            originName,
            routeId: routes[0].routeId,
            start: routes[0].startCoords,
            time: departureTimeQuery,
            uid,
        };
        LogUtils.log({ category: 'routeRequest', request });
        AnalyticsUtils.assignRouteIdsAndCache(routes);

        return routes;
    }
}

export default new RouteRouter().router;
