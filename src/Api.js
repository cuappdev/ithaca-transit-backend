// @flow
import bodyParser from 'body-parser';
import { Router } from 'express';

import AppDevAPI from './appdev/AppDevAPI';
import AlertsRouter from './routers/AlertsRouter';
import AllStopsRouter from './routers/AllStopsRouter';
import DelayRouter from './routers/DelayRouter';
import HelloWorldRouter from './routers/HelloWorldRouter';
import PlacesAutocompleteRouter from './routers/PlacesAutocompleteRouter';
import RouteRouter from './routers/RouteRouter';
import MultiRouteRouter from './routers/MultiRouteRouter';
import TrackingRouter from './routers/TrackingRouter';

class API extends AppDevAPI {
    getPath(): string {
        return '/api/v1/';
    }

    middleware(): Array<any> {
        return [
            bodyParser.json(),
        ];
    }

    routers(): Array<Router> {
        return [
            AlertsRouter,
            AllStopsRouter,
            DelayRouter,
            HelloWorldRouter,
            MultiRouteRouter,
            PlacesAutocompleteRouter,
            RouteRouter,
            TrackingRouter,
        ];
    }
}

export default API;
