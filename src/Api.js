// @flow
import { AppDevAPI } from 'appdev';
import bodyParser from 'body-parser';
import { Router } from 'express';

import AlertsRouter from './routers/AlertsRouter';
import AllStopsRouter from './routers/AllStopsRouter';
import DelayRouter from './routers/DelayRouter';
import HelloWorldRouter from './routers/HelloWorldRouter';
import PlacesAutocompleteRouter from './routers/PlacesAutocompleteRouter';
import RouteRouter from './routers/RouteRouter';
import TrackingRouter from './routers/TrackingRouter';
import TestMiddleware from './test/TestMiddleware.js';

class API extends AppDevAPI {
    getPath(): string {
        return '/api/v1/';
    }

    middleware(): Array<any> {
        return [
            bodyParser.json(),
        ].concat(TestMiddleware);
    }

    routers(): Array<Router> {
        return [
            AlertsRouter,
            AllStopsRouter,
            DelayRouter,
            HelloWorldRouter,
            PlacesAutocompleteRouter,
            RouteRouter,
            TrackingRouter,
        ];
    }
}

export default API;
