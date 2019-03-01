// @flow
import bodyParser from 'body-parser';

import ApplicationAPI from './appdev/ApplicationAPI';
import Routers from './routers/index';

class API extends ApplicationAPI {
  getPath(): string {
    return '/api/';
  }

  middleware(): Array<Object> {
    return [bodyParser.json()];
  }

  routerGroups(): Object {
    return {
      v1: [
        Routers.AlertsRouter,
        Routers.AllStopsRouter,
        Routers.DelayRouter,
        Routers.HelloWorldRouter,
        Routers.MultiRouteRouter,
        Routers.PlacesAutocompleteRouter,
        Routers.RouteRouter,
        Routers.RouteSelectedRouter,
        Routers.SearchRouter,
        Routers.TrackingRouter,
      ],
      v2: [
        Routers.AlertsRouter,
        Routers.AllStopsRouter,
        Routers.DelayRouter,
        Routers.HelloWorldRouter,
        Routers.MultiRouteRouter,
        Routers.PlacesAutocompleteRouter,
        Routers.RouteSelectedRouter,
        Routers.SearchRouter,
        Routers.SectionRouteRouter,
        Routers.TrackingRouter,
      ],
    };
  }
}

export default API;
