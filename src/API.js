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
    const sharedRouters = [
      Routers.AlertsRouter,
      Routers.AllStopsRouter,
      Routers.ApplePlacesRouter,
      Routers.AppleSearchRouter,
      Routers.HelloWorldRouter,
      Routers.MultiRouteRouter,
      Routers.PlacesAutocompleteRouter,
      Routers.PlaceIDCoordinatesRouter,
      Routers.SearchRouter,
      Routers.TrackingRouter,
    ];
    return {
      docs: [Routers.DocsRouter],
      v1: [
        ...sharedRouters,
        Routers.RouteRouter,
        Routers.DelayRouter,
      ],
      v2: [
        ...sharedRouters,
        Routers.RouteV2Router,
        Routers.DelaysV2Router,
      ],
      v3: [
        ...sharedRouters,
        Routers.RouteV3Router,
        Routers.DelaysV3Router,
      ],
    };
  }
}

export default API;
