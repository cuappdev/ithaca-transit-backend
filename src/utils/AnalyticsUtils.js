// @flow
import crypto from 'crypto';

function getUniqueId(numBytes: ?number = 10) {
  return crypto.randomBytes(numBytes).toString('hex');
}

function assignRouteIdsAndCache(routeRes: Object[]) {
  routeRes.forEach((route) => {
    route.routeId = getUniqueId();
  });
}

export default {
  getUniqueId,
  assignRouteIdsAndCache,
};
