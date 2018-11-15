// @flow
import type Request from 'express';
import ApplicationRouter from '../appdev/ApplicationRouter';
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
            destinationName,
            end,
            start,
            time: departureTimeQuery,
            arriveBy,
        } = req.query;
        return RouteUtils.getRoute(destinationName, end, start, departureTimeQuery, arriveBy);
    }
}

export default new RouteRouter().router;
