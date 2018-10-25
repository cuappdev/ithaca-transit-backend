// @flow
import AppDevRouter from '../appdev/AppDevRouter';
import RealtimeFeedUtils from '../utils/RealtimeFeedUtils';

class TrackingRouter extends AppDevRouter<Object> {
    constructor() {
        super('POST');
    }

    getPath(): string {
        return '/tracking/';
    }

    // eslint-disable-next-line require-await
    async content(req): Promise<any> {
        if (!req.body || !req.body.data || !req.body.data.length || req.body.data.length === 0) {
            return {
                case: 'invalidRequest',
            };
        }
        return RealtimeFeedUtils.getTrackingResponse(req.body.data);
    }
}

export default new TrackingRouter().router;
