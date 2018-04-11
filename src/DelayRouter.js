// @flow
import { AppDevRouter } from 'appdev'; 
import RealtimeFeedUtils from './RealtimeFeedUtils';
import type Request from 'express';
import axios from 'axios';

class DelayRouter extends AppDevRouter<Object> {

    constructor() {
        super('GET');
    }

    getPath(): string {
        return '/delay/';
    }

    async content(req: Request): Promise<any> {
        let stopID = req.query.stopID;
        let tripID = req.query.tripID;
        let delay = RealtimeFeedUtils.getDelay(stopID, tripID);
        if (delay) {
            delay = delay;
        }
        return {
            delay: delay
        };
    }
}

export default new DelayRouter().router;