import crypto from 'crypto';

function getUniqueId(numBytes = 10) {
  return crypto.randomBytes(numBytes).toString('hex');
}

function assignRouteIdsAndCache(routeRes) {
  routeRes.forEach((route) => {
    route.routeId = getUniqueId();
  });
}

export default {
  getUniqueId,
  assignRouteIdsAndCache,
};
