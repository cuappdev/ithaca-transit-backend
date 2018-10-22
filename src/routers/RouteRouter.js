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
        return RouteUtils.getRoutes(req);
    }
}

export default new RouteRouter().router;
