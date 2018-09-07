// @flow
import { AppDevRouter } from 'appdev';
import type Request from 'express';
import RealtimeFeedUtils from '../utils/RealtimeFeedUtils';

class DelayRouter extends AppDevRouter<Object> {
    constructor() {
        super('GET');
    }

    getPath(): string {
        return '/delay/';
    }

    async content(req: Request): Promise<any> {
        const { stopID } = req.query;
        const { tripID } = req.query;
        const delay = RealtimeFeedUtils.getDelay(stopID, tripID);
        return { delay };
    }
}

export default new DelayRouter().router;
