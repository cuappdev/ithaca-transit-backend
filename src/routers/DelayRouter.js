// @flow
import { AppDevRouter } from 'appdev';
import type Request from 'express';
import axios from 'axios';
import RealtimeFeedUtils from '../utils/RealtimeFeedUtils';

class DelayRouter extends AppDevRouter<Object> {
    constructor() {
        super('GET');
    }

    getPath(): string {
        return '/delay/';
    }

    async content(req: Request): Promise<any> {
        const stopID = req.query.stopID;
        const tripID = req.query.tripID;
        let delay = RealtimeFeedUtils.getDelay(stopID, tripID);
        if (delay) {
            delay = delay;
        }
        return {
            delay,
        };
    }
}

export default new DelayRouter().router;
