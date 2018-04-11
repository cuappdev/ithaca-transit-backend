// @flow

import { AppDevAPI} from 'appdev';
import { Router } from 'express';
import bodyParser from 'body-parser';
import HelloWorldRouter from './HelloWorldRouter';
import TrackingRouter from './TrackingRouter';
import RouteRouter from './RouteRouter';
import AllStopsRouter from './AllStopsRouter';
import AlertsRouter from './AlertsRouter';
import DelayRouter from './DelayRouter';

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