// @flow
import { AppDevRouter } from 'appdev';
import type Request from 'express';
import RealtimeFeedUtils from '../utils/RealtimeFeedUtils';

/**
 * Router object for retrieving bus delay data.
 * @extends AppDevRouter
 */
class DelayRouter extends AppDevRouter<Object> {
    constructor() {
        super('GET');
    }

    getPath(): string {
        return '/delay/';
    }

    // Retrieves the bus delay for a bus at a specific stop
    async content(req: Request): Promise<any> {
        const { stopID, tripID } = req.query;
        const delay = RealtimeFeedUtils.getDelay(stopID, tripID);
        return { delay };
    }
}

export default new DelayRouter().router;
