// @flow
import AppDevRouter from '../appdev/AppDevRouter';
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
        const res = RealtimeFeedUtils.getTrackingInformation(
            stopID,
            tripID,
            await RealtimeFeedUtils.realtimeFeed,
        );
        return res;
    }
}

export default new DelayRouter().router;
