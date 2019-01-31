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
        const rtf = await RealtimeFeedUtils.fetchRTF();
        const res = await RealtimeFeedUtils.getDelayInformation(stopID, tripID, rtf);
        if (res) return res.delay;
        return null;
    }
}

export default new DelayRouter().router;
