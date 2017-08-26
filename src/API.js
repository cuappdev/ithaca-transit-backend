// @flow
import express from 'express';
import bodyParser from 'body-parser';

import GetAllStopsRouter from './routers/GetAllStopsRouter';
import GetRouteRouter from './routers/GetRouteRouter';
import GetBusesRouter from './routers/GetBusesRouter';

class API {
  express: Object;

  constructor () {
    this.express = express();
    this.middleware();
    this.routes();
  }

  middleware (): void {
    this.express.use(bodyParser.json());
    this.express.use(bodyParser.urlencoded({ extended: false }));
  }

  _use (Router: any): void {
    this.express.use('/api/v1', Router);
  }

  routes (): void {
    this._use(GetAllStopsRouter);
    this._use(GetRouteRouter);
    this._use(GetBusesRouter);
  }
}

export default API;
