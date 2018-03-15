// @flow
import AbstractRouter from './AbstractRouter';
import AllStopUtils from './AllStopUtils';

class AllStopsRouter extends AbstractRouter {

    constructor() {
        super('GET', '/allStops', true);
    }

    async content(req: Request): Promise<any> {
		return AllStopUtils.fetchAllStops();
    }
}

export default new AllStopsRouter().router;