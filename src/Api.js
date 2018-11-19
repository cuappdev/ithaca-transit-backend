// @flow
import bodyParser from 'body-parser';
import { Router } from 'express';

import ApplicationAPI from './appdev/ApplicationAPI';
import AlertsRouter from './routers/AlertsRouter';
import AllStopsRouter from './routers/AllStopsRouter';
import DelayRouter from './routers/DelayRouter';
import HelloWorldRouter from './routers/HelloWorldRouter';
import PlacesAutocompleteRouter from './routers/PlacesAutocompleteRouter';
import RouteRouter from './routers/RouteRouter';
import RouteRouterV2 from './routers/RouteRouterV2';
import MultiRouteRouter from './routers/MultiRouteRouter';
import TrackingRouter from './routers/TrackingRouter';

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
                TrackingRouter,
            ],
            v2: [
                AlertsRouter,
                AllStopsRouter,
                DelayRouter,
                HelloWorldRouter,
                MultiRouteRouter,
                PlacesAutocompleteRouter,
                RouteRouterV2,
                TrackingRouter,
            ],
        };
    }
}

export default API;
