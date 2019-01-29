// @flow
import ApplicationRouter from '../appdev/ApplicationRouter';
import LogUtils from '../utils/LogUtils';
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
        LogUtils.log({
            category: 'DelayRouter: request received',
            stopID,
            tripID,
        });
        const res = await RealtimeFeedUtils.getDelayInformation(stopID, tripID);
        return res.delay;
    }
}

export default new DelayRouter().router;
