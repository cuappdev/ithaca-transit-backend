// @flow
import type Request from 'express';
import ApplicationRouter from '../appdev/ApplicationRouter';
import LogUtils from '../utils/LogUtils';
import RouteUtils from '../utils/RouteUtils';

/**
 * Router object that returns an array of the best available route for each
 * destination, specified from a single start destination.
 * @extends ApplicationRouter
 */
class MultiRouteRouter extends ApplicationRouter<Array<Object>> {
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
            destinationNames,
            end,
            start,
            time: departureTimeQuery,
        } = req.query;

        // each destinationName should correspond to one end point
        if (destinationNames.length !== end.length) {
            return [];
        }

        // multiple destinations given
        const routes = [];
        for (let i = 0; i < destinationNames.length; i++) {
            routes.push(RouteUtils.getRoutes(destinationNames[i], end[i], start, departureTimeQuery, false));
        }

        return Promise.all(routes).then(val => val).catch((err) => {
            throw LogUtils.logErr(err, routes, 'Could not get all specified routes');
        });
    }
}

export default new MultiRouteRouter().router;
