// @flow

import { AppDevAPI} from 'appdev';
import { Router } from 'express';
import bodyParser from 'body-parser';
import HelloWorldRouter from './routers/HelloWorldRouter';
import TrackingRouter from './routers/TrackingRouter';
import RouteRouter from './routers/RouteRouter';
import AllStopsRouter from './routers/AllStopsRouter';
import DelayRouter from './routers/DelayRouter';
import AlertsRouter from './routers/AlertsRouter';

class API extends AppDevAPI {

    constructor() {
        super();
    }

    getPath(): string {
        return '/api/v1/';
    }

    middleware(): Array<any> {
        return [bodyParser.json()];
    }

    routers(): Array<Router> {
        return [
            HelloWorldRouter,
            TrackingRouter,
            RouteRouter,
            AllStopsRouter,
            DelayRouter,
            AlertsRouter
        ];
    }
}

export default API;