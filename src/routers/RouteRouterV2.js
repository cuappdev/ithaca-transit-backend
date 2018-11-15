// @flow
import type Request from 'express';
import AppDevRouter from '../appdev/AppDevRouter';
import RouteUtils from '../utils/RouteUtils';

class RouteRouterV2 extends AppDevRouter<Array<Object>> {
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
        return RouteUtils.getDetailedRoute(destinationName, end, start, departureTimeQuery, arriveBy);
    }
}

export default new RouteRouterV2().router;
