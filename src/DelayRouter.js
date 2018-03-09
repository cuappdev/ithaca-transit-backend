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
        let stopID = req.query.stopID
        let tripID = req.query.tripID
        return RealtimeFeedUtils.getDelay(stopID, tripID);
    }

}

export default new DelayRouter().router;