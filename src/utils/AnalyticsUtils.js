// @flow
import crypto from 'crypto';
import LRU from 'lru-cache';
import LogUtils from './LogUtils';
import Schemas from './Schemas';

const routesCalculationsCache = LRU({
    max: 1000, // max 1000 routes in storage
    maxAge: 1000 * 60 * 15, // max age 15 minutes
});

function getUniqueId(numBytes: ?number = 10) {
    return crypto.randomBytes(numBytes).toString('hex');
}

function assignRouteIdsAndCache(routeRes: Object[]) {
    routeRes.forEach((route) => {
        route.routeId = getUniqueId();
        storeRouteTemp(route);
    });
}

function storeRouteTemp(route: Object) {
    routesCalculationsCache.set(route.routeId, route);
}

function selectRoute(routeId: string, uid: ?string) {
    const route = routesCalculationsCache.get(routeId);
    if (route) {
        if (uid) {
            route.uid = uid;
        }
        return LogUtils.logToChronicle(
            'routeSelected',
            Schemas.routeResultSchemaV1,
            route,
        );
    }
    return false;
}

export default {
    getUniqueId,
    selectRoute,
    assignRouteIdsAndCache,
};
