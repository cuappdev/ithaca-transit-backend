// @flow
import type Request from 'express';
import ApplicationRouter from '../../appdev/ApplicationRouter';
import LogUtils from '../../utils/LogUtils';
import RouteUtils from '../../utils/RouteUtils';

const CURRENT_LOCATION = 'Current Location';

/**
 * Router object that returns an array of the best available route for each
 * destination, specified from a single start destination.
 * @extends ApplicationRouter
 */
class MultiRouteRouter extends ApplicationRouter<Array<Object>> {
  constructor() {
    super(['GET', 'POST']);
  }

  getPath(): string {
    return '/multiroute/';
  }

  // Request does not require an arriveBy query param, unlike in RouteRouter
  // eslint-disable-next-line require-await
  async content(req: Request): Promise<Array<Object>> {
    const params = req.method === 'GET' ? req.query : req.body;
    const {
      destinationNames,
      end,
      start,
      time: departureTimeQuery,
    } = params;

    // each destinationName should correspond to one end point
    if (destinationNames.length !== end.length) {
      return [];
    }

    // get array of routes for each destination
    const multiRoutes = destinationNames.map((destinationName, index) => RouteUtils.getRoutes(
      CURRENT_LOCATION,
      destinationName,
      end[index],
      start,
      departureTimeQuery,
      false,
    ));

    // return the best route for each destination
    return Promise.all(multiRoutes).then((val) => {
      const bestRoutes = val.map(routes => (routes.length > 0 ? routes[0] : null));
      return bestRoutes;
    }).catch((err) => {
      throw LogUtils.logErr(err, multiRoutes, 'Could not get all specified routes');
    });
  }
}

export default new MultiRouteRouter().router;
