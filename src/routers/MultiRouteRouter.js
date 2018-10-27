// @flow
import type Request from 'express';
import AppDevRouter from '../appdev/AppDevRouter';
import ErrorUtils from '../utils/LogUtils';
import RouteUtils from '../utils/RouteUtils';

/**
 * Router object that returns an array of the best available route for each
 * destination, specified from a single start destination.
 * @extends AppDevRouter
 */
class MultiRouteRouter extends AppDevRouter<Array<Object>> {
    constructor() {
        super('GET');
    }

    getPath(): string {
        return '/multiroute/';
    }

    // Request does not require an arriveBy query param, unlike in RouteRouter
    // eslint-disable-next-line require-await
    async content(req: Request): Promise<Array<Object>> {
        const {
            destinationName,
            end,
            start,
            time: departureTimeQuery,
        } = req.query;
        
        // only one destination given
        if (typeof destinationName === 'string') {
            return RouteUtils.getRoute(destinationName, end, start, departureTimeQuery, false);
        }

        // multiple destinations given
        const routes = [];
        for (let i = 0; i < destinationName.length; i++) {
            routes.push(RouteUtils.getRoute(destinationName[i], end[i], start, departureTimeQuery, false));
        }
        
        return Promise.all(routes).then(val => val).catch((err) => {
            throw ErrorUtils.logErr(err, routes, 'Could not get all specified routes');
        });
    }
}

export default new MultiRouteRouter().router;
