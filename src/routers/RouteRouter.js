// @flow
import { AppDevRouter } from 'appdev';
import type Request from 'express';
import RouteUtils from '../utils/RouteUtils';

class RouteRouter extends AppDevRouter<Array<Object>> {
    constructor() {
        super('GET');
    }

    getPath(): string {
        return '/route/';
    }

    async content(req: Request): Promise<Array<Object>> {
        const {
            destinationName,
            end,
            start,
            time: departureTimeQuery,
        } = req.query;
        const arriveBy: boolean = req.query.arriveBy === '1';

        return RouteUtils.getRoute(destinationName, end, start, departureTimeQuery, arriveBy);
    }
}

export default new RouteRouter().router;
