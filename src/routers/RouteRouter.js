// @flow
import type Request from 'express';
import ApplicationRouter from '../appdev/ApplicationRouter';
import RouteUtils from '../utils/RouteUtils';
import LogUtils from '../utils/LogUtils';
import Schemas from '../utils/Schemas';
import AnalyticsUtils from '../utils/AnalyticsUtils';

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
            destinationName,
            end,
            start,
            time: departureTimeQuery,
            arriveBy,
        } = req.query;

        const routeRes = await RouteUtils.getRoute(destinationName, end, start, departureTimeQuery, arriveBy);

        console.log(req.query);
        const request = {
            destinationName,
            start: routeRes[0].startCoords,
            end: routeRes[0].endCoords,
            time: departureTimeQuery,
            arriveBy,
            routeId: routeRes[0].routeId,
        };
        LogUtils.logToChronicle('routeRequestV1', Schemas.routeRequestSchema, request, true)
            .then((res) => {
                console.log('LOGGED ROUTEREQ', res);
            });

        AnalyticsUtils.assignRouteIdsAndCache(routeRes);

        return routeRes;
    }
}

export default new RouteRouter().router;
