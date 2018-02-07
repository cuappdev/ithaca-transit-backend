// @flow
import express from 'express';
import bodyParser from 'body-parser';

import HelloWorldRouter from './routers/HelloWorldRouter';
import GetAllStopsRouter from './routers/GetAllStopsRouter';
import GetRouteRouter from './routers/GetRouteRouter';
import GetBusesRouter from './routers/GetBusesRouter';
import GetBusTrackingRouter from './routers/GetBusTrackingRouter';
import WebApiCallRouter from './routers/WebApiCallRouter';

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
    this._use(HelloWorldRouter);
    //this._use(GetAllStopsRouter);
    //this._use(GetRouteRouter);
    //this._use(GetBusesRouter);
    //this._use(GetBusTrackingRouter);
    this._use(new WebApiCallRouter('/rest/RouteDetails/GetAllRouteDetails', '/webApi/routeDetails/').router);
    this._use(new WebApiCallRouter('/rest/Stop/GetAllStops', '/webApi/stops/').router);
    this._use(new WebApiCallRouter('/rest/StopDepartures/GetAllStopDepartures', '/webApi/stopDepartures/').router);
    this._use(new WebApiCallRouter('/rest/Vehicles/GetAllVehicles', '/webApi/vehicles/').router);
    this._use(new WebApiCallRouter('/rest/TransitAuthorityConfig/Get', '/webApi/transitAuthorityConfig/').router);
    this._use(new WebApiCallRouter('/rest/PublicMessages/GetAllMessages', '/webApi/publicMessages/').router);
  }
}
export default API;
