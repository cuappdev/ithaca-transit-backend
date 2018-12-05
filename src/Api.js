// @flow
import bodyParser from 'body-parser';

import ApplicationAPI from './appdev/ApplicationAPI';
import AlertsRouter from './routers/AlertsRouter';
import AllStopsRouter from './routers/AllStopsRouter';
import DelayRouter from './routers/DelayRouter';
import HelloWorldRouter from './routers/HelloWorldRouter';
import PlacesAutocompleteRouter from './routers/PlacesAutocompleteRouter';
import RouteRouter from './routers/RouteRouter';
import RouteRouterV2 from './routers/RouteRouterV2';
import MultiRouteRouter from './routers/MultiRouteRouter';
import MultiRouteRouterV2 from './routers/MultiRouteRouterV2';
import TrackingRouter from './routers/TrackingRouter';
import RouteSelectedRouter from './routers/RouteSelectedRouter';

class API extends ApplicationAPI {
    getPath(): string {
        return '/api/';
    }

    middleware(): Array<any> {
        return [
            bodyParser.json(),
        ];
    }

    routerGroups(): Object {
        return {
            v1: [
                AlertsRouter,
                AllStopsRouter,
                DelayRouter,
                HelloWorldRouter,
                MultiRouteRouter,
                PlacesAutocompleteRouter,
                RouteRouter,
                RouteSelectedRouter,
                TrackingRouter,
            ],
            v2: [
                AlertsRouter,
                AllStopsRouter,
                DelayRouter,
                HelloWorldRouter,
                MultiRouteRouterV2,
                PlacesAutocompleteRouter,
                RouteRouterV2,
                RouteSelectedRouter,
                TrackingRouter,
            ],
        };
    }
}

export default API;
