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

    async content(req: Request): Promise<any> {
        return AllStopUtils.getAllStops();
    }
}

export default new AllStopsRouter().router;
