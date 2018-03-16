// @flow
import AbstractRouter from './AbstractRouter';
import RealtimeFeedUtils from './RealtimeFeedUtils';
import type Request from 'express';
import axios from 'axios';

class DelayRouter extends AbstractRouter {

    constructor() {
        super('GET', '/delay', true);
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