// @flow
import AllStopUtils from '../../utils/AllStopUtils';
import ApplicationRouter from '../../appdev/ApplicationRouter';

class AllStopsRouter extends ApplicationRouter<Array<Object>> {
  constructor() {
    super(['GET']);
  }

  getPath(): string {
    return '/allStops/';
  }

  // eslint-disable-next-line require-await
  async content(req): Promise<any> {
    return AllStopUtils.fetchAllStops();
  }
}

export default new AllStopsRouter().router;
