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
        const { stopID, tripID } = req.query;
        return RealtimeFeedUtils.getDelay(stopID, tripID).delay;
    }
}

export default new DelayRouter().router;
