// @flow
import { AppDevRouter } from 'appdev';
import AllStopUtils from '../utils/AllStopUtils';

class AllStopsRouter extends AppDevRouter<Array<Object>> {
    constructor() {
        super('GET');
    }

    getPath(): string {
        return '/allStops/';
    }

    // eslint-disable-next-line require-await
    async content(req): Promise<any> {
        return AllStopUtils.allStops;
    }
}

export default new AllStopsRouter().router;
