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
        return RealtimeFeedUtils.getTrackingInformation(stopID, tripID).delay;
    }
}

export default new DelayRouter().router;
