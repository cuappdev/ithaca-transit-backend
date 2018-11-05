// @flow
import ApplicationRouter from '../appdev/ApplicationRouter';
import RealtimeFeedUtils from '../utils/RealtimeFeedUtils';

class DelayRouter extends ApplicationRouter<Object> {
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
