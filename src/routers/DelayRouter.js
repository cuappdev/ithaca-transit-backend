// @flow
import { AppDevRouter } from 'appdev';
import RealtimeFeedUtils from '../utils/RealtimeFeedUtils';

class DelayRouter extends AppDevRouter<Object> {
    constructor() {
        super('GET');
    }

    getPath(): string {
        return '/delay/';
    }

    async content(req): Promise<any> {
        const { stopID, tripID } = req.query;
        return RealtimeFeedUtils.getDelay(stopID, tripID);
    }
}

export default new DelayRouter().router;
