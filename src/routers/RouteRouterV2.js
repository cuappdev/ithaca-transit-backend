// @flow
import type Request from 'express';
import ApplicationRouter from '../appdev/ApplicationRouter';
import RouteUtilsV2 from '../utils/RouteUtilsV2';

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
        return RouteUtilsV2.getRoute(destinationName, end, start, departureTimeQuery, arriveBy);
    }
}

export default new RouteRouterV2().router;
