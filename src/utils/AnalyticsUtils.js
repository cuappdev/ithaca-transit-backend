// @flow
import crypto from 'crypto';
import LRU from 'lru-cache';
import Constants from './Constants';
import LogUtils from './LogUtils';

const routesCalculationsCache = LRU(Constants.ROUTES_CALC_CACHE_OPTIONS);

function getUniqueId(numBytes: ?number = 10) {
  return crypto.randomBytes(numBytes).toString('hex');
}

function assignRouteIdsAndCache(routeRes: Object[]) {
  routeRes.forEach((route) => {
    route.routeId = getUniqueId();
    routesCalculationsCache.set(route.routeId, { route });
  });
}

function selectRoute(routeId: string, uid: ?string) {
  const routeSchema = routesCalculationsCache.get(routeId);
  if (routeSchema) {
    if (uid) {
      routeSchema.route.uid = uid;
    }

    return LogUtils.log({ category: 'routeSelected', route: routeSchema.route });
  }
  return false;
}

export default {
  getUniqueId,
  selectRoute,
  assignRouteIdsAndCache,
};
