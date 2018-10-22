// @flow
import { AppDevRouter } from 'appdev';
import type Request from 'express';
import RouteUtils from '../utils/RouteUtils';

/**
 * Router object that returns the best available route for each destination,
 * specified from a single start destination.
 * @extends AppDevRouter
 */
class MultiRouteRouter extends AppDevRouter<Array<Object>> {
    constructor() {
        super('GET');
    }

    getPath(): string {
        return '/multiroute/';
    }

    /**
     * Returns an array of Routes, one for each destination.
     * However, returns a single Route if only one destination specified.
     */
    async content(req: Request): Promise<Array<Object>> {
        // only one destination
        if (typeof req.query.destinationName === 'string') {
            return RouteUtils.getRoutes(req);
        }
        const routes = [];
        let i;

        // multiple destinations
        for (i = 0; i < req.query.destinationName.length; i++) {
            const temp = await RouteUtils.getRoutes(req, true, i);
            routes.push(temp[0]);
        }
        return routes;
    }
}

export default new MultiRouteRouter().router;
